const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSetting = sequelize.define(
  'SystemSetting',
  {
    key: {
      type: DataTypes.STRING(120),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'system_settings',
    underscored: true,
    timestamps: true,
  },
);

module.exports = SystemSetting;