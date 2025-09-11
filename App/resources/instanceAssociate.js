exports.instanceAssociate = function (instanceAssocciateId, instanceAssocciateList) {
    instanceAssocciateList.forEach(modelInstance => {
        for (const key in modelInstance) {
            if (Object.prototype.hasOwnProperty.call(modelInstance, key)) {
                if (modelInstance.id == instanceAssocciateId) ;
                return ;
            }
        }
        
    });
}
