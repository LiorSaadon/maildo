module.exports = function() {


    var filterByPage = function(mails, data){

        setDefaults(data);

        var range = setRange(mails, data);

        var metadata = {};

        metadata.to = range.to;
        metadata.from = range.from;
        metadata.total = mails.length;
        metadata.currPage = Math.floor(range.from/data.nPerPage);

        return {
            metadata:metadata,
            collection: mails.slice(range.from, range.to + 1)
        } ;
    };

    //---------------------------------------------------

    var setDefaults =  function(data){

        data = data || {};

        data.nPerPage =  data.nPerPage || 5;
        data.pageNumber =  data.pageNumber || 1;
    };

    //----------------------------------------------------

    var setRange = function(mails, data){

        var from = (data.pageNumber - 1) * data.nPerPage;
        var to = (data.pageNumber * data.nPerPage) - 1;

        if (from > 0 && from >= mails.length) {
            from =  Math.floor((mails.length -1) / data.nPerPage) * data.nPerPage;
            to = Math.min(from + data.nPerPage - 1, mails.length - 1);
        }
        return{
            from:from,
            to:to
        };
    };

    //-----------------------------------------------------

    return{
        filterByPage:filterByPage
    }
}();

