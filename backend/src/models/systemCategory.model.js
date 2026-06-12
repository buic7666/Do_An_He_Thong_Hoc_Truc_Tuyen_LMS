const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemCategory = sequelize.define(
  'SystemCategory',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'system_categories',
    underscored: true,
    timestamps: true,
  },
);

module.exports = SystemCategory;