/*
*                      Copyright 2020 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import _ from 'lodash'
import { types } from '@salto-io/lowerdash'
import {
  Element, isObjectType, isInstanceElement, TypeElement, InstanceElement, Field, PrimitiveTypes,
  isPrimitiveType, Value, ElemID, CORE_ANNOTATIONS, SaltoElementError, SaltoErrorSeverity,
  ReferenceExpression, Values, isElement, RESTRICTION_ANNOTATIONS,
} from '@salto-io/adapter-api'
import { makeArray } from '@salto-io/lowerdash/dist/src/collections/array'
import { UnresolvedReference, resolve, CircularReference } from './expressions'

export abstract class ValidationError extends types.Bean<Readonly<{
  elemID: ElemID
  error: string
  severity: SaltoErrorSeverity
}>> implements SaltoElementError {
  get message(): string {
    return `Error validating "${this.elemID.getFullName()}": ${this.error}`
  }

  toString(): string {
    return this.message
  }
}

const primitiveValidators = {
  [PrimitiveTypes.STRING]: _.isString,
  [PrimitiveTypes.NUMBER]: _.isNumber,
  [PrimitiveTypes.BOOLEAN]: _.isBoolean,
}

/**
 * Validate that all type fields values corresponding with core annotations (required, values)
 * @param value
 * @param type
 */
const validateAnnotations = (elemID: ElemID, value: Value, type: TypeElement):
ValidationError[] => {
  if (isObjectType(type)) {
    return _.flatten(Object.keys(type.fields).map(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      k => validateFieldAnnotations(elemID.createNestedID(k), value[k], type.fields[k])
    ))
  }

  return []
}

export class InvalidValueValidationError extends ValidationError {
  readonly value: Value
  readonly fieldName: string
  readonly expectedValue: unknown

  static formatExpectedValue(expectedValue: unknown): string {
    return _.isArray(expectedValue)
      ? `one of: ${(expectedValue as []).map(v => `"${v}"`).join(', ')}`
      : `"${expectedValue}"`
  }

  constructor(
    { elemID, value, fieldName, expectedValue }:
      { elemID: ElemID; value: Value; fieldName: string; expectedValue: unknown }
  ) {
    super({
      elemID,
      error: `Value "${value}" is not valid for field ${fieldName}`
        + ` expected ${InvalidValueValidationError.formatExpectedValue(expectedValue)}`,
      severity: 'Warning',
    })
    this.value = value
    this.fieldName = fieldName
    this.expectedValue = expectedValue
  }
}

export class InvalidValueRangeValidationError extends ValidationError {
  readonly value: Value
  readonly fieldName: string
  readonly minValue?: number
  readonly maxValue?: number

  static formatExpectedValue(minValue: number | undefined, maxValue: number | undefined): string {
    const minErrStr: string = _.isUndefined(minValue) ? '' : `bigger than ${minValue}`
    const maxErrStr: string = _.isUndefined(maxValue) ? '' : `smaller than ${maxValue}`
    return _.join([minErrStr, maxErrStr], ' and ')
  }

  constructor(
    { elemID, value, fieldName, minValue, maxValue }:
      { elemID: ElemID; value: Value; fieldName: string; minValue?: number; maxValue?: number }
  ) {
    super({
      elemID,
      error: `Value "${value}" is not valid for field ${fieldName}`
        + ` expected to be ${InvalidValueRangeValidationError.formatExpectedValue(minValue, maxValue)}`,
      severity: 'Warning',
    })
    this.value = value
    this.fieldName = fieldName
    this.minValue = minValue
    this.maxValue = maxValue
  }
}

export class MissingRequiredFieldValidationError extends ValidationError {
  readonly fieldName: string

  constructor({ elemID, fieldName }: { elemID: ElemID; fieldName: string }) {
    super({
      elemID,
      error: `Field ${fieldName} is required but has no value`,
      severity: 'Warning',
    })
    this.fieldName = fieldName
  }
}

export class UnresolvedReferenceValidationError extends ValidationError {
  constructor(
    { elemID, ref }:
    { elemID: ElemID; ref: string }
  ) {
    super({ elemID, error: `unresolved reference ${ref}`, severity: 'Error' })
  }
}


export class CircularReferenceValidationError extends ValidationError {
  constructor(
    { elemID, ref }:
    { elemID: ElemID; ref: string }
  ) {
    super({ elemID, error: `circular reference ${ref}`, severity: 'Warning' })
  }
}

const validateAnnotationsValue = (
  elemID: ElemID, value: Value, annotations: Values, type: TypeElement
): ValidationError[] | undefined => {
  const shouldEnforceValue = (): boolean =>
    annotations[CORE_ANNOTATIONS.RESTRICTION]?.[RESTRICTION_ANNOTATIONS.ENFORCE_VALUE] !== false
    && !(value instanceof ReferenceExpression && isElement(value.value))

  const validateRestrictionsValue = (val: Value):
    ValidationError[] => {
    // When value is array we iterate (validate) each element
    if (_.isArray(val)) {
      return _.flatten(val.map(v => validateRestrictionsValue(v)))
    }

    const validateValueInsideRange = (): ValidationError[] => {
      const minValue = annotations[CORE_ANNOTATIONS.RESTRICTION]?.[RESTRICTION_ANNOTATIONS.MIN]
      const maxValue = annotations[CORE_ANNOTATIONS.RESTRICTION]?.[RESTRICTION_ANNOTATIONS.MAX]
      if ((minValue && (val < minValue)) || (maxValue && (val > maxValue))) {
        return [
          new InvalidValueRangeValidationError(
            { elemID, value, fieldName: elemID.name, minValue, maxValue }
          ),
        ]
      }
      return []
    }

    const validateValueInList = (): ValidationError[] => {
      const restrictionValues = makeArray(annotations[CORE_ANNOTATIONS.VALUES])
      if (_.isEmpty(restrictionValues)) {
        return []
      }
      if (!restrictionValues.some(i => _.isEqual(i, val))) {
        return [
          new InvalidValueValidationError(
            { elemID, value, fieldName: elemID.name, expectedValue: restrictionValues }
          ),
        ]
      }
      return []
    }

    const restrictionValidations = [validateValueInsideRange, validateValueInList]
    return _.flatten(restrictionValidations.map(validation => validation()))
  }

  const validateRequiredValue = (): ValidationError[] =>
    (annotations[CORE_ANNOTATIONS.REQUIRED] === true
      ? [new MissingRequiredFieldValidationError({ elemID, fieldName: elemID.name })] : [])

  // Checking _required annotation
  if (value === undefined) {
    return validateRequiredValue()
  }

  // Checking restrictions
  if (isPrimitiveType(type) && shouldEnforceValue()) {
    return validateRestrictionsValue(value)
  }

  return undefined
}

/**
 * Validate that field values corresponding with core annotations (_required, _values, _restriction)
 * @param value- the field value
 * @param field
 */
const validateFieldAnnotations = (
  elemID: ElemID, value: Value, field: Field,
): ValidationError[] => {
  const errors = validateAnnotationsValue(elemID, value, field.annotations, field.type)
  if (!_.isUndefined(errors)) {
    return errors
  }

  // Apply validateAnnotations for each element in our values list
  if (field.isList) {
    return _.isArray(value)
      ? _.flatten(value.map((v, i) => validateAnnotations(
        elemID.createNestedID(String(i)),
        v,
        field.type
      )))
      : []
  }

  return validateAnnotations(elemID, value, field.type)
}

export class InvalidValueTypeValidationError extends ValidationError {
  readonly value: Value
  readonly type: TypeElement

  constructor({ elemID, value, type }: { elemID: ElemID; value: Value; type: TypeElement }) {
    super({
      elemID,
      error: `Invalid value type for ${type.elemID.getFullName()} : ${JSON.stringify(value)}`,
      severity: 'Warning',
    })
    this.value = value
    this.type = type
  }
}

const validateValue = (elemID: ElemID, value: Value,
  type: TypeElement, isAnnotations = false): ValidationError[] => {
  if (value instanceof ReferenceExpression) {
    return isElement(value.value) ? [] : validateValue(elemID, value.value, type)
  }
  if (value instanceof UnresolvedReference) {
    return [new UnresolvedReferenceValidationError({ elemID, ref: value.ref })]
  }
  if (value instanceof CircularReference) {
    return [new CircularReferenceValidationError({ elemID, ref: value.ref })]
  }
  if (isPrimitiveType(type)) {
    if (!primitiveValidators[type.primitive](value)) {
      // NOTE: this area should be deleted as soon as
      //  we complete the implementation of SALTO-484 (i.e. support container's type)
      if (!isAnnotations || !_.isArray(value)) {
        return [new InvalidValueTypeValidationError({ elemID, value, type })]
      }
      return _.flatten(value.map((val: Value) => validateValue(elemID, val, type, false)))
    }
  }

  if (isObjectType(type)) {
    if (!_.isObjectLike(value)) {
      // NOTE: this area should be deleted as soon as
      //  we complete the implementation of SALTO-484 (i.e. support container's type)
      return [new InvalidValueTypeValidationError({ elemID, value, type })]
    }
    if (_.isArray(value)) {
      return _.flatten(value.map((val: Value) => validateValue(elemID, val, type, isAnnotations)))
    }
    return _.flatten(Object.keys(value).filter(k => type.fields[k]).map(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      k => validateFieldValue(elemID.createNestedID(k), value[k], type.fields[k], isAnnotations)
    ))
  }

  return validateAnnotationsValue(elemID, value, type.annotations, type) || []
}

const validateFieldValue = (elemID: ElemID, value: Value, field: Field, isAnnotations: boolean):
  ValidationError[] => {
  if (field.isList) {
    // todo remove the !isAnnotations once SALTO-228 (Support annotationTypes list) is implemented
    if (!_.isArray(value) && !isAnnotations) {
      return [new InvalidValueValidationError({ elemID, value, fieldName: field.name, expectedValue: 'a list' })]
    }
    return _.flatten(
      makeArray(value).map((v, i) =>
        validateValue(elemID.createNestedID(String(i)), v, field.type, isAnnotations))
    )
  }
  return validateValue(elemID, value, field.type, isAnnotations)
}

const validateField = (field: Field): ValidationError[] =>
  _.flatten(Object.keys(field.annotations)
    .filter(k => field.type.annotationTypes[k])
    .map(k => validateValue(
      field.elemID.createNestedID(k),
      field.annotations[k],
      field.type.annotationTypes[k],
      true
    )))

const validateType = (element: TypeElement): ValidationError[] => {
  const errors = _.flatten(Object.keys(element.annotations)
    .filter(k => element.annotationTypes[k]).map(
      k => validateValue(
        element.elemID.createNestedID('attr', k),
        element.annotations[k],
        element.annotationTypes[k],
        true
      )
    ))

  if (isObjectType(element)) {
    return [...errors, ..._.flatten(Object.values(element.fields).map(validateField))]
  }
  return errors
}

const instanceElementValidators = [
  validateValue,
  validateAnnotations,
]

const validateInstanceElements = (element: InstanceElement): ValidationError[] =>
  _.flatten(instanceElementValidators.map(v => v(element.elemID, element.value, element.type)))

export const validateElements = (elements: Element[]): ValidationError[] => (
  _(resolve(elements))
    .map(e => (isInstanceElement(e) ? validateInstanceElements(e) : validateType(e as TypeElement)))
    .flatten()
    .value()
)