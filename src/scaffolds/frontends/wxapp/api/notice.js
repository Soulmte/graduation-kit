const request = require('./request');

module.exports = {
  pageQuery: (query) => request.post('/notice/pageQuery', query),
  getById: (id) => request.get(`/notice/getById/${id}`)
};
