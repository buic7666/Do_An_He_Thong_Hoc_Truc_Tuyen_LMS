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
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approvalStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'APPROVED',
      field: 'approvalStatus',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      field: 'isPublished',
    },
  },
  {
    tableName: 'courses',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Course;