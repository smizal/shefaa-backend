const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')

// Cloudinary Config
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer storage configuration
const storage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: {
		folder: (req, file) => {
			let distFolder = 'shefaa'
			if (req.url.startsWith('/users')) {
				distFolder+= '/users'
			} else if (req.url.startsWith('/labs')) {
				distFolder+= '/labs'
			}
			return distFolder
		},
		allowed_formats: ['gif', 'jpg', 'png', 'jpeg', 'pdf', 'docx', 'doc'],
	},
})

module.exports = { cloudinary, storage }
