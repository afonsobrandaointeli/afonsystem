module.exports.models = {
  schema: true,
  migrate: 'alter',
  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true, },
    updatedAt: { type: 'number', autoUpdatedAt: true, },
    id: { type: 'number', autoIncrement: true, },
  },
  dataEncryptionKeys: {
    default: 'Tw5TJqzApLNtzmU09/YPHHkypThOFbg8h4pNbeNY5/A='
  },
  cascadeOnDestroy: true
};
