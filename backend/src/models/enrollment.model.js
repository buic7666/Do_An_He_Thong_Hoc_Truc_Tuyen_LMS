const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Enrollment = sequelize.define(
  'Enrollment',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'user_id',
    },
    courseId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: 'course_id',
    },
    status: {
      type: DataTypes.ENUM('pending', 'active'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'enrollments',
    underscored: true,
    timestamps: true,
  },
);

module.exports = Enrollment;