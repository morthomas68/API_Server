const Repository = require('../models/Repository');

module.exports = 
class BookmarksController extends require('./Controller') {
    constructor(req, res){
        super(req, res);
        this.bookmarksRepository = new Repository('Bookmarks');
    }
    getAll() {
        this.response.JSON(this.bookmarksRepository.getAll());
    }
    // Choisie quelle type de get faire. (Un bookmark particulier, tous les bookmarks, une recherche selon category et nom ou un trie)
    get(id) {
        let params = this.getQueryStringParams();
        let sortList = this.bookmarksRepository.getAll();
        if (!isNaN(id))
            this.response.JSON(this.bookmarksRepository.get(id));
        else if (params !== null){
            if (Object.keys(params).length === 0){
                this.response.JSON(this.bookmarksRepository.getAll());
            } else{
                if ('name' in params || 'category' in params)
                    this.response.JSON(this.search(params));
                else if ('sort' in params){
                    this.response.JSON(this.sortBookmarks(params, sortList));
                }
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
        this.res.writeHead(200,{'content-type':'text/html'});
        this.res.end(content) + "</div>";
    }
    post(bookmark) {  
        // Valide que le bookmark n'est pas déjà rentrer sur le site et vérifie que l'adresse ip est valide 
        if (this.isNotDuplicateBookmark(bookmark)){
            if(this.isValidUrl(bookmark.Url)){
                let newBookmark = this.bookmarksRepository.add(bookmark);
                if (newBookmark)
                    this.response.created(JSON.stringify(newBookmark));
                else
                    this.response.internalError();
            }
            else{
                this.response.unprocessable(); // a remplacer
            }
        }
        else{
            this.response.unprocessable(); // a remplacer
        }
    }
    isNotDuplicateBookmark(bookmark) {
        let bookmarksList = this.bookmarksRepository.getAll();

        for (let object of bookmarksList){
            if(bookmark.Name.toLowerCase() === object.Name.toLowerCase())
                return false;  
        }
        return true;
    }
    isValidUrl(string) {
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
          '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
          '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
          '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
          '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
          '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(string);
    }
    isValidBookmark(bookmark) {
        let bookmarksList = this.bookmarksRepository.getAll();
        console.log(bookmarksList);
        console.log(bookmark)
        for (let object of bookmarksList){
            if (bookmark.Id === object.Id){
                if(bookmark.Name !== object.Name){
                    if (this.isNotDuplicateBookmark(bookmark)){
                        return true
                    }
                }
                else {
                    return true;
                }
            }
        }
        return false;
    }
    put(bookmark) {
        // Vérifie que l'url du bookmark est toujours valide
        if (this.isValidBookmark(bookmark)){
            if(this.isValidUrl(bookmark.Url)){
                if (this.bookmarksRepository.update(bookmark))
                    this.response.ok();
                else 
                    this.response.notFound();
            }
            else{
                this.response.unprocessable(); // a remplacer
            }
        }
        else{
            this.response.unprocessable(); // a remplacer
        }
    }
    remove(id) {
        if (this.bookmarksRepository.remove(id))
            this.response.accepted();
        else
            this.response.notFound();
    }
    search(params) {
        let searchList = [];
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

        if ('sort' in params){
            searchList = this.sortBookmarks(params, searchList);
        }

        return searchList;
    }
    sortBookmarks(params, sortList) {

        if ('sort' in params){
            if(params.sort === "name")
            {
                if (params.order === "asc")
                    sortList.sort((a, b) => a.Name.toLowerCase() > b.Name.toLowerCase() && 1 || -1);
                else if (params.order === "desc")
                    sortList.sort((a, b) => b.Name.toLowerCase() > a.Name.toLowerCase() && 1 || -1);
            }
            else if (params.sort === "category")
            {   
                if (params.order === "asc")
                    sortList.sort((a, b) => a.Category.toLowerCase() > b.Category.toLowerCase() && 1 || -1);
                else if (params.order === "desc")
                    sortList.sort((a, b) => b.Category.toLowerCase() > a.Category.toLowerCase() && 1 || -1);
            }
        }
        return sortList;
    }
}
