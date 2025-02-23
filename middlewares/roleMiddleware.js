const authorizeRoles = (...allowedTRoles)=>{
    return(req,res,next)=>{
        if (!allowedTRoles.includes(req.Utilisateur.Role)){
            return res.status(403).json({message:"access denied"});
        }
        next();
    }

}
module.exports=authorizeRoles;