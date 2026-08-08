const request = require('./request');

module.exports = {
  login: (username, password) => request.post('/user/login', { username, password }),
  register: (data) => request.post('/user/register', data),
  updateUser: (data) => request.put('/user/update', data),
  updatePassword: (oldPassword, newPassword) =>
    request.put('/user/updatePassword', { oldPassword, newPassword }),
  pageQueryUser: (query) => request.post('/user/pageQuery', query)
};
