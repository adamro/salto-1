export const HUBSPOT = 'hubspot'

export const OBJECTS_NAMES = {
  FORM: 'form',
  WORKFLOWS: 'workflows',
  MARKETINGEMAIL: 'marketingEmail',

  // Subtypes
  PROPERTYGROUP: 'PropertyGroup',
  PROPERTY: 'Property',
  OPTIONS: 'options',
  CONTACTLISTIDS: 'contactListIds',
  RSSTOEMAILTIMING: 'rssToEmailTiming',
  NURTURETIMERANGE: 'nurtureTimeTange',
  ACTION: 'action',
  ANCHORSETTING: 'anchorSetting',
  CRITERIA: 'criteria',
  CRITERIALIST: 'criteriaList',
  EVENTANCHOR: 'eventAnchor',
  CONDITIONACTION: 'conditionAction',
}

export const FIELD_TYPES = {
  TEXTAREA: 'textarea',
  TEXT: 'text',
  DATE: 'date',
  FILE: 'file',
  NUMBER: 'number',
  SELECT: 'select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  BOOLEANCHECKBOX: 'booleancheckbox',
}

export const FORM_FIELDS = {
  GUID: 'guid',
  NAME: 'name',
  CSSCLASS: 'cssClass',
  REDIRECT: 'redirect',
  SUBMITTEXT: 'submitText',
  NOTIFYRECIPIENTS: 'notifyRecipients',
  IGNORECURRENTVALUES: 'ignoreCurrentValues',
  DELETABLE: 'deletable',
  INLINEMESSAGE: 'inlineMessage',
  CREATEDAT: 'createdAt',
  CAPTCHAENABLED: 'captchaEnabled',
  CLONEABLE: 'cloneable',
  EDITABLE: 'editable',
  STYLE: 'style',
  FORMFIELDGROUPS: 'formFieldGroups',
}

export const MARKETING_EMAIL_FIELDS = {
  AB: 'ab',
  ABHOURSWAIT: 'abHoursToWait',
  ABVARIATION: 'abVariation',
  ABSAMPLESIZEDEFAULT: 'abSampleSizeDefault',
  ABSAMPLINGDEFAULT: 'abSamplingDefault',
  ABSTATUS: 'abStatus',
  ABSUCCESSMETRIC: 'abSuccessMetric',
  ABTESTID: 'abTestId',
  ABTESTPERCENTAGE: 'abTestPercentage',
  ABSOLUTEURL: 'absoluteUrl',
  ALLEMAILCAMPAIGNIDS: 'allEmailCampaignIds',
  ANALYTICSPAGEID: 'analyticsPageId',
  ANALYTICSPAGETYPE: 'analyticsPageType',
  ARCHIVED: 'archived',
  AUTHOR: 'author',
  AUTHORAT: 'authorAt',
  AUTHOREMAIL: 'authorEmail',
  AUTHORNAME: 'authorName',
  AUTHORUSERID: 'authorUserId',
  BLOGEMAILTYPE: 'blogEmailType',
  BLOGRSSSETTINGS: 'blogRssSettings',
  CAMPAIGN: 'campaign',
  CAMPAIGNNAME: 'campaignName',
  CANSPAMSETTINGSID: 'canSpamSettingsId',
  CATEGORYID: 'categoryId',
  CLONEDFROM: 'clonedFrom',
  CONTENTTYPECATEGORY: 'contentTypeCategory',
  CREATEPAGE: 'createPage',
  CREATED: 'created',
  CURRENTLYPUBLISHED: 'currentlyPublished',
  DOMAIN: 'domain',
  EMAILBODY: 'emailBody',
  EMAILNOTE: 'emailNote',
  EMAILTYPE: 'emailType',
  FEEDBACKEMAILCATEGORY: 'feedbackEmailCategory',
  FEEDBACKSURVEYID: 'feedbackSurveyId',
  FLEXAREAS: 'flexAreas',
  FOLDERID: 'folderId',
  FREEZEDATE: 'freezeDate',
  FROMNAME: 'fromName',
  HTMLTITLE: 'htmlTitle',
  ID: 'id',
  ISGRAYMAILSUPPRESSIONENABLED: 'isGraymailSuppressionEnabled',
  ISLOCALTIMEZONESEND: 'isLocalTimezoneSend',
  ISPUBLISHED: 'isPublished',
  ISRECIPIENTFATIGUESUPPRESSIONENABLED: 'isRecipientFatigueSuppressionEnabled',
  LEADFLOWID: 'leadFlowId',
  LIVEDOMAIN: 'liveDomain',
  MAILINGLISTSEXCLUDED: 'mailingListsExcluded',
  MAILINGLISTSINCLUDED: 'mailingListsIncluded',
  MAXRSSENTRIES: 'maxRssEntries',
  METADESCRIPTION: 'metaDescription',
  NAME: 'name',
  PAGEEXPIRYDATE: 'pageExpiryDate',
  PAGEEXPIRYREDIRECTEID: 'pageExpiryRedirectId',
  PAGEREDIRECTED: 'pageRedirected',
  PORTALID: 'portalId',
  PREVIEWKEY: 'previewKey',
  PROCESSINGSTATUS: 'processingStatus',
  PUBLISHDATE: 'publishDate',
  PUBLISHEDAT: 'publishedAt',
  PUBLISHEDBYID: 'publishedById',
  PUBLISHEDBYNAME: 'publishedByName',
  PUBLISHIMMEDIATELY: 'publishImmediately',
  PUBLISHEDURL: 'publishedUrl',
  REPLYTO: 'replyTo',
  RESOLVEDDOMAIN: 'resolvedDomain',
  RSSEMAILAUTHORLINETEMPLATE: 'rssEmailAuthorLineTemplate',
  RSSEMAILBLOGIMAGEMAXWIDTH: 'rssEmailBlogImageMaxWidth',
  RSSEMAILBYTEXT: 'rssEmailByText',
  RSSEMAILCLICKTHROUGHTEXT: 'rssEmailClickThroughText',
  RSSEMAILCOMMENTTEXT: 'rssEmailCommentText',
  RSSEMAILENTRYTEMPLATE: 'rssEmailEntryTemplate',
  RSSEMAILENTRYTEMPLATEENABLED: 'rssEmailEntryTemplateEnabled',
  RSSEMAILURL: 'rssEmailUrl',
  RSSTOEMAILTIMING: 'rssToEmailTiming',
  SLUG: 'slug',
  SMARTEMAILFIELDS: 'smartEmailFields',
  STYLESETTINGS: 'styleSettings',
  SUBCATEGORY: 'subcategory',
  SUBJECT: 'subject',
  SUBSCRIPTION: 'subscription',
  SUBSCRIPTIONBLOGID: 'subscriptionBlogId',
  SUBSCRIPTIONNAME: 'subscription_name',
  TEMPLATEPATH: 'templatePath',
  TRANSACTIONAL: 'transactional',
  UNPUBLISHEDAT: 'unpublishedAt',
  UPDATED: 'updated',
  UPDATEDBYID: 'updatedById',
  URL: 'url',
  USERSSHEADLINEASSUBJECT: 'useRssHeadlineAsSubject',
  VIDSEXCLUDED: 'vidsExcluded',
  VIDSINCLUDED: 'vidsIncluded',
  WIDGETS: 'widgets',
  WORKFLOWNAMES: 'workflowNames',
}

export const RSSTOEMAILTIMING_FIELDS = {
  REPEATS: 'repeats',
  REPEATS_ON_MONTHLY: 'repeats_on_monthly',
  REPEATS_ON_WEEKLY: 'repeats_on_weekly',
  TIME: 'time',
}

export const PROPERTY_GROUP_FIELDS = {
  DEFAULT: 'default',
  FIELDS: 'fields',
  ISSMARTGROUP: 'isSmartGroup',
}

export const PROPERTY_FIELDS = {
  NAME: 'name',
  LABEL: 'label',
  DESCRIPTION: 'description',
  GROUPNAME: 'groupName',
  TYPE: 'type',
  FIELDTYPE: 'fieldType',
  REQUIRED: 'required',
  HIDDEN: 'hidden',
  ISSMARTFIELD: 'isSmartField',
  DEFAULTVALUE: 'defaultValue',
  SELECTEDOPTIONS: 'selectedOptions',
  OPTIONS: 'options',
}

export const OPTIONS_FIELDS = {
  LABEL: 'label',
  DESCRIPTION: 'description',
  VALUE: 'value',
  HIDDEN: 'hidden',
  ISSMARTFIELD: 'isSmartField',
  DISPLAYORDER: 'displayOrder',
}

export const WORKFLOWS_FIELDS = {
  ID: 'id',
  NAME: 'name',
  TYPE: 'type',
  ENABLED: 'enabled',
  INSERTEDAT: 'insertedAt',
  UPDATEDAT: 'updatedAt',
  PERSONTALIDS: 'personaTagIds',
  CONTACTLISTIDS: 'contactListIds',
  ACTIONS: 'actions',
  INTERNAL: 'internal',
  ONLYEXECONBIZDAYS: 'onlyExecOnBizDays',
  NURTURETIMERANGE: 'nurtureTimeRange',
  LISTENING: 'listening',
  ALLOWCONTACTTOTRIGGERMULTIPLETIMES: 'allowContactToTriggerMultipleTimes',
  GOALCRITERIA: 'goalCriteria',
  ONLYENROLLMANUALLY: 'onlyEnrollsManually',
  ENROLLONCRITERIAUPDATE: 'enrollOnCriteriaUpdate',
  LASTUPDATEDBY: 'lastUpdatedBy',
  SUPRESSIONLISTIDS: 'supressionListIds',
  SEGMENTCRITERIA: 'segmentCriteria',
  EVENTANCHOR: 'eventAnchor',
}

export const EVENTANCHOR_FIELDS = {
  STATICDATEANCHOR: 'staticDateAnchor',
  CONTACTPROPERTYANCHOR: 'contactPropertyAnchor',
}

export const NURTURETIMERANGE_FIELDS = {
  ENABLED: 'enabled',
  STARTHOUR: 'startHour',
  STOPHOUR: 'stopHour',
}

export const ACTION_FIELDS = {
  TYPE: 'type',
  ANCHORSETTING: 'anchorSetting',
  ACTIONID: 'actionId',
  DELAYMILLS: 'delayMillis',
  STEPID: 'stepId',
  FILTERSLISTID: 'filtersListId',
  NEWVALUE: 'newValue',
  ACCEPTACTIONS: 'acceptActions',
  PROPERTYNAME: 'propertyName',
  REJECTACTIONS: 'rejectActions',
}

export const CONDITIONACTION_FIELDS = {
  TYPE: 'type',
  BODY: 'body',
  STATICTO: 'staticTo',
  ACTIONID: 'actionId',
  STEPID: 'stepId',
}

export const ANCHOR_SETTING_FIELDS = {
  EXECTIMEOFDAY: 'execTimeOfDay',
  EXECTIMEINMINUTES: 'execTimeInMinutes',
  BOUNDARY: 'boundary',
}

export const CONTACTLISTIDS_FIELDS = {
  ENROLLED: 'enrolled',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUCCEEDED: 'succeeded',
}