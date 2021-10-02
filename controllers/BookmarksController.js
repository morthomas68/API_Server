const Repository = require('../models/Repository');

module.exports = 
class BookmarksController extends require('./Controller') {
    constructor(req, res){
        super(req, res);
        this.bookmarksRepository = new Repository('Bookmarks');
    }
    getAll(){
        this.response.JSON(this.bookmarksRepository.getAll());
    }
    get(id){
        let params = this.getQueryStringParams();
        if (!isNaN(id))
            this.response.JSON(this.bookmarksRepository.get(id));
        else if (params !== null){
            if (Object.keys(params).length === 0) {
                this.response.JSON(this.bookmarksRepository.getAll());
            } else { 
                this.response.JSON(this.search(params));
            }
        }
        else
            this.response.JSON(this.bookmarksRepository.getAll());
    }
    help() {
        // expose all the possible query strings
        let content = "<div style=font-family:arial>";
        content += "<h3>GET : Search endpoint  <br> List of possible query strings:</h3><hr>";
        content += "<h4>? name = website_name & category = category_name<h4>";
        content += "<h4>? name = website_name<h4>";
        content += "<h4>? category = category_name<h4>";
        this.res.writeHead(200, {'content-type':'text/html'});
        this.res.end(content) + "</div>";
    }
    post(bookmark){  
        // todo : validate bookmark before insertion
        // todo : avoid duplicates
        if (this.isNotDuplicateBookmark(bookmark)){
            newBookmark = this.bookmarksRepository.add(bookmark);
            if (newBookmark)
                this.response.created(JSON.stringify(newBookmark));
            else
                this.response.internalError();
        }
        else
            this.response.ok();
    }
    isNotDuplicateBookmark(bookmark){
        let bookmarksList = this.bookmarksRepository.getAll();
        for (let object of bookmarksList) {
            if(bookmark.Name.toLowerCase() === object.Name.toLowerCase())
                return false;  
        }
        return true;
    }
    put(bookmark){
        
        // todo : validate bookmark before updating
        if (this.bookmarksRepository.update(bookmark))
            this.response.ok();
        else 
            this.response.notFound();
    }
    remove(id){
        if (this.bookmarksRepository.remove(id))
            this.response.accepted();
        else
            this.response.notFound();
    }
    search(params){
        let searchList = []
        let bookmarksList = this.bookmarksRepository.getAll();
        let bookmarkName;
        let bookmarkCategory;

        if ('name' in params && 'category' in params){
            for (let bookmark of bookmarksList){
                bookmarkName = bookmark.Name.toLowerCase();
                bookmarkCategory = bookmark.Category.toLowerCase();
                if (bookmarkName.indexOf(params.name.toLowerCase()) !== -1 && bookmarkCategory.indexOf(params.category.toLowerCase()) !== -1)
                    searchList.push(bookmark);
            }
        }
        else if ('name' in params){
            for (let bookmark of bookmarksList){
                bookmarkName = bookmark.Name.toLowerCase();
                if (bookmarkName.indexOf(params.name.toLowerCase()) !== -1)
                    searchList.push(bookmark);
            }
        }
        else if ('category' in params){
            for (let bookmark of bookmarksList){
                bookmarkCategory = bookmark.Category.toLowerCase();
                if (bookmarkCategory.indexOf(params.category.toLowerCase()) !== -1)
                    searchList.push(bookmark);
            }
        }
        return searchList;
    }
}
