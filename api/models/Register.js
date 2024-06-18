module.exports = {
  attributes: {
    email: {
      type: "string",
      required: true,
      isEmail: true,
    },
    turma: {
      type: "string",
      required: true,
      enum: ["T11", "T12", "T13", "T14"],
    },
    grupo: {
      type: "string",
      required: true,
      enum: ["G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08"],
    },
    impedimento: {
      type: "string",
      allowNull: true,
    },
    grooming: {
      type: "string",
      allowNull: true,
    },
  },
};
