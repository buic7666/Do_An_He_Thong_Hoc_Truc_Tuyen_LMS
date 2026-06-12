const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeacherProfile = sequelize.define(
  'TeacherProfile',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    teacherId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'teacher_id',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    linkedin: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
    },
    facebook: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
    },
    bankName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
      field: 'bank_name',
    },
    bankAccount: {
      type: DataTypes.STRING(80),
      allowNull: true,
      defaultValue: '',
      field: 'bank_account',
    },
    bankOwner: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
      field: 'bank_owner',
    },
  },
  {
    tableName: 'teacher_profiles',
    underscored: true,
    timestamps: true,
  },
);

module.exports = TeacherProfile;
