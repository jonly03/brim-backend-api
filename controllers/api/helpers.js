function getRandomItem(arr){
    const randIdx = Math.floor(Math.random() * arr.length);
    return arr[randIdx];
}

module.exports = {
    getRandomItem
}