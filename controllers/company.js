const User = require("../models/User")

const createCompanyUser = async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            phoneCode,
            role
        } = req.body

        const user = new User({
            name,
            email,
            mobile,
            phoneCode,
            company: req.user.companyId,
            role
        })

        await user.save()

        res.status(201).json({ message: 'User created successfully', user })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const updateCompanyUser = async (req, res) => {
    try {
        const { userId } = req.params
        const {
            name,
            email,
            mobile,
            phoneCode,
            role
        } = req.body

        const user = await User.findByIdAndUpdate(userId, {
            name,
            email,
            mobile,
            phoneCode,
            role
        }, { new: true })

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        res.status(200).json({ message: 'User updated successfully', user })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

module.exports = {createCompanyUser, updateCompanyUser}

