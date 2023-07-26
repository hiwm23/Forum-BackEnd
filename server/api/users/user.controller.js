const { register, profile, userById, getUserByEmail, getAllUsers } = require('./user.service');
const pool = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')


module.exports = {


    createUser: (req, res) => {
        const { userName, firstName, lastName, email, password } = req.body
        console.log(req.body)
        if (!userName || !firstName || !lastName || !email || !password)
            return res.status(400).json({ msg: 'Not all fields have been provided!' })
        if (password.length < 8)
            return res.status(400).json({ msg: 'Password must be at least 8 characters!' })
        
        pool.query('SELECT * FROM registration WHERE user_email = ?',
            [email],
            (err, results) => {
                if (err) {
                return res
                    .status(err)
                    .json({msg: 'Database connection err'})   
                }
                if (results.length > 0) {
                    return res
                        .status(400)
                        .json({msg: 'An account with this email already exists!'})   
                } else {
                    const salt = bcrypt.genSaltSync();
                    // req.body.password = bcrypt.hashSync(password, salt);
                    req.body.user_password = bcrypt.hashSync(password, salt);


                    register(req.body, (err, results) => {
                        if (err) {
                            console.log(err)
                            return res
                            .status(500)
                .json({msg: 'Database connection err'});   
                        }

                
                    pool.query('SELECT * FROM registration WHERE user_email = ?', [email],
                        (err, results) => {
                            if (err) {
                                return res
                                    .status(err)
                                    .json({ msg: 'Database connection err' })
                            }
                            req.body.userId = results[0].user_id;
                            console.log(req.body);
                            profile(req.body, (err, results) => {
                                if (err) {
                                    console.log(err)
                                    return res
                                        .status(500)
                                        .json({ msg: 'Database connection err' })
                                }
                                return res.status(200).json({
                                    msg: 'New user added successfully',
                                    data: results
                                })
                        
                            })

                        }
                    
                    );       
                        
                    })
                }
            })  
    },
    getUsers: (req, res) => {
        getAllUsers((err, results) => {
            if (err) {
                console.log(err);
                return res
                    .status(500)
                    .json({ msg: 'Database connnection error' });
            }
            return res.status(200).json({ data: results });
        })
    },
    getUserById: (req, res) => {
        
        userById(req.id, (err, results) => {
            if (err) {
                console.log(err)
                return res
                    .status(500)
                    .json({msg:'database connection error'})
            }
            if (!results) {
                return res.status(404).json({msg:'Record not found'})
            }
                return res.status(200).json({data:results})
        })
    },
    login: (req, res) => {
        const { email, password } = req.body;
// vallidation
        
        if (!email || !password)
            return res
                .status(400)
                .json({ msg: 'not all fields have been provided!' });
        getUserByEmail(email, (err, results) => {
            if (err) {
                console.log(err);
                res.status(500).json({ msg: 'database connection err' });
            }
            if (!results) {
                return res
                    .status(404)
            .json({msg:'No account with this email has been registered'})
            }  

            const isMatch = bcrypt.compareSync(password,results.user_password)
            if (!isMatch)
                return res
                    .status(404)
                    .json({ msg: 'Invaild Credentials' })
            // const token = jwt.sign({ id: results.user_id }, process.env.JWT_SECRERT, { expiresIn: '1h' });
            const token = jwt.sign({ id: results.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            return res.json({
                token,
                user: {
                    id: results.user_id,
                    display_name: results.user_name
                }
            })
         })

    } 



}