function generateAssociateIDArray( primaryIdRange,associateIdRange){
    const primaryIdNumber = primaryIdRange[1]- primaryIdRange[0]
    const [LowerLimit,UpperLimit] = associateIdRange;
    const instanceIdArray = [];
    let Id = LowerLimit;
    for (let index = 0; index <= primaryIdNumber; index++) {
      
      if (Id <= UpperLimit ) {
        instanceIdArray.push(Id);
        Id++;
      }else{
        instanceIdArray.push(generateRandomNumber(LowerLimit,UpperLimit));
      }
      
    }
    return instanceIdArray;
  }

  function generatePrimaryIDArray([lowerLimit, upperLimit]){
    const idArray = [];
    while (lowerLimit <= upperLimit) {
      idArray.push(lowerLimit);
      lowerLimit++;
    }
    return idArray;
  }
function generateRandomNumber(...arg){
    const [min,max] = arg;
    const number = (min -0.5) + Math.random() * (max-min+1);
    return Math.round(number);
}

function generateRandomStatus(statusList,bookInstancePrimaryIds){
  const randomStatusValueList = bookInstancePrimaryIds.map((id,index)=>{
    const randomIndex = generateRandomNumber(0,statusList.length - 1);
    return statusList[randomIndex];

  })

  return randomStatusValueList;
}

generateRandomStatus(['ggg','fgtr','fuuu','htwa'],[4,5,6,3,2,1]);

module.exports = {generateAssociateIDArray,generatePrimaryIDArray,generateRandomStatus};