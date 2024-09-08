import {UniqueConstraintError, ValidationError} from "sequelize";

export default (error)=>{

    if (error instanceof UniqueConstraintError) {
        return {msg: 'UniqueConstraintError'};
    }

    if (error instanceof ValidationError) {
        return {msg: 'ValidationError'};
    }

    console.error('Database error:', error);
    throw new Error('Database error');
}