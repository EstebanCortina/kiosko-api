import { DataTypes } from 'sequelize';
import sequelize from "../config/sequelize.js";
import User from "./user.js";

const Feed = sequelize.define('Feed', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    topics: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    is_favorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'feed',
    timestamps: true,
    underscored: true,
});

import('./user.js').then((module) => {
    const User = module.default;
    Feed.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
});

export default Feed;
