const multer = require("multer")

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, "./ogbmain/images")
    },
    filename:(req,file,cb)=>{
        cb(null, Date.now() +"_" + file.originalname)
    }
})
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
        cb(null, true)
    } else {
        cb({message: 'Unsupported file format'}, false)
    }
}  

const upload = multer({
    storage,
    fileFilter
})
module.exports = upload;