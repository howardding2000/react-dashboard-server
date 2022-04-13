/** 
 * Handle the route for uploading files
*/

const multer = require('multer')
const path = require('path')
const fs = require('fs')

const dirPath = path.join(__dirname, '..', 'public/upload')

const storage = multer.diskStorage({
  // destination: 'upload', if type is 'string', the service startup will automatically create folders
  destination: function (req, file, cb) { 
    //The function creates folders manually
    // console.log('destination()', file)
    if (!fs.existsSync(dirPath)) {
      fs.mkdir(dirPath, function (err) {
        if (err) {
          console.log(err)
        } else {
          cb(null, dirPath)
        }
      })
    } else {
      cb(null, dirPath)
    }
  },
  filename: function (req, file, cb) {
    // console.log('filename()', file)
    var ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + Date.now() + ext)
  }
})
const upload = multer({storage})
const uploadSingle = upload.single('image')

module.exports = function fileUpload(router) {

  // upload image
  router.post('/manage/img/upload', (req, res) => {
    uploadSingle(req, res, function (err) { 
      if (err) {
        return res.send({
          status: 1,
          msg: 'Uploading files failed.'
        })
      }
      var file = req.file
      res.send({
        status: 0,
        data: {
          name: file.filename,
          url: 'http://localhost:5000/upload/' + file.filename
        }
      })

    })
  })

  // Delete images
  router.post('/manage/img/delete', (req, res) => {
    const {name} = req.body
    fs.unlink(path.join(dirPath, name), (err) => {
      if (err) {
        console.log(err)
        res.send({
          status: 1,
          msg: 'Failed to delete an image.'
        })
      } else {
        res.send({
          status: 0
        })
      }
    })
  })
}
