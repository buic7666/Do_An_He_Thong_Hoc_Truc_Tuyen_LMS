const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define(
  'Course',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    instructorId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'instructor_id',
    },
  },
  {
    tableName: 'courses',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Course;