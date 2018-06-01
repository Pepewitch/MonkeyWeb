import { Router } from 'express';
import { body } from 'express-validator/check';
import { UserRegistrationStage } from '../../../models/v1/studentState';
import { UserStatus } from '../../../models/v1/user';
import { User } from '../../../repositories/v1/User';
import { validateRequest } from '../../ApiValidator';

export const router = Router();

router.post('/listTutor',
    (req, res) => {
        User.getInstance().listTutors()
            .subscribe(
                (tutors) => res.status(200).send({ tutors }),
                (error) => res.status(500).send(error),
        );
    },
);

router.post('/listStudent',
    body('quarterID').isInt(),
    body('userStatus').isIn(Object.keys(UserStatus)).optional(),
    body('registrationStage').isIn(Object.keys(UserRegistrationStage)).optional(),
    body('grade').isInt().optional(),
    validateRequest,
    (req, res) => {
        User.getInstance().listStudent(req.body.quarterID, {
            Grade: req.body.grade,
            Stage: req.body.registrationStage,
            UserStatus: req.body.userStatus,
        }).subscribe(
            (students) => res.status(200).send({ students }),
            (error) => res.status(500).send(error),
        );
    },
);

router.post('/getUserInfo',
    body('userID').isInt(),
    validateRequest,
    (req, res) => {
        User.getInstance().getUserInfo(
            req.body.userID,
        ).subscribe(
            (user) => res.status(200).send({ user }),
            (error) => res.status(500).send(error),
        );
    },
);