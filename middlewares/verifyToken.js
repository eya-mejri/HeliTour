const jwt = require('jsonwebtoken');

const verifyToken=(req,res,next)=>{
    const token =req.headers['authorization']?.split(' ')[1];
    if (!token){
        return res.status(403).json({message:'No token provided'})
    }jwt.verify(token,'123456789',(err,decoded)=>{
        if (err){
            return res.status(500).json({message:'Failed to authenticate token'});
        }
        req.Utilisateur=decoded;
        
        next();
    })
}
module.exports=verifyToken