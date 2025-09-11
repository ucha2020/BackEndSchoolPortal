const generateLinkedIdList = (objList) =>{
    return objList.map((modelInstance,index,objList)=>{
        return modelInstance.id;
    })
};

exports.checkAssociatedModelInstances = (allModelInstanceList,associatedModelInstanceList)=>{
    const idList = generateLinkedIdList(associatedModelInstanceList);
    return allModelInstanceList.map((modelInstance)=>{
        modelInstance.selected = idList.includes( modelInstance.id);
        return modelInstance;
    })
};

exports.get_Obj_array_from_id_array = async(idArray, Model)=>{
    let array = [];
    if(!idArray){
        return array ;
    }
    for await (const id of idArray) {
        const modelInstance = await Model.findByPk(id);
        array.push(modelInstance);
    }

    return array ;

}