const generateLinkedIdList = (objList) => {
  return objList.map((modelInstance, index, objList) => {
    return modelInstance.id;
  });
};

exports.checkAssociatedModelInstances = (
  allModelInstanceList,
  associatedModelInstanceList
) => {
  const idList = generateLinkedIdList(associatedModelInstanceList);
  return allModelInstanceList.map((modelInstance) => {
    modelInstance.selected = idList.includes(modelInstance.id);
    return modelInstance;
  });
};

exports.get_Obj_array_from_id_array = async (idArray, Model) => {
  let array = [];
  if (!idArray) {
    return array;
  }
  for await (const id of idArray) {
    const modelInstance = await Model.findByPk(id);
    array.push(modelInstance);
  }

  return array;
};

exports.getRouteLink = (url, name) => {
  if (url == "/") {
    const link = {
      url: "/",
      label: "Home",
    };
    return [link];
  }

  const linkArr = [];
  function fxn(url, name) {
    let link;
    let linkUrl = url;
    const routeArr = url.split("/");
    let label = routeArr.pop();

    if (label.match(/\d+/)) {
      linkUrl = url.replace(/\d+/, `$&/display`);
      label = name + label;
    }
    link = {
      url: linkUrl,
      label,
    };
    linkArr.push(link);
    if (routeArr.length > 1) {
      const arr = routeArr.join("/");
      fxn(arr, name);
    } else if (routeArr.length == 1) {
      link = {
        url: "/",
        label: "Home",
      };
      linkArr.push(link);
    }
  }
  fxn(url, name);
  return linkArr.reverse();
};
