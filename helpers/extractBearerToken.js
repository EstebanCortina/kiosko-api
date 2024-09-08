export default (reqAuthHeader) => {
    return reqAuthHeader.split(' ')[1]
}