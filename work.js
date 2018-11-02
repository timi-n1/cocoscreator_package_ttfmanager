const parseXlsx = require('excel').default;
const fs = require('fs-extra');
const path = require('path');
const glob = require("glob");
const async = require("async");

class Worker{

    constructor(){
        this.folderList = [
            path.resolve(Editor.projectInfo.path, '../config'),
            path.resolve(Editor.projectInfo.path, './assets')
        ];
        this.allFilse = [];
        this.cache = {};
        this.charList = [];
        this.makeEntry();
        this.getAllChar(()=>{
            this.sortAllChar();
            const list = this.charList.join('');
            Editor.warn(`共${list.length}个字`);
            fs.writeFile(path.resolve(Editor.projectInfo.path, './assets-origin/ttf/all.txt'), list);
        });
    }

    makeEntry(){
        this.folderList.forEach((folder)=>{
            this.allFilse = this.allFilse.concat( glob.sync(`${folder}/**/*`, {}) );
        });
    }

    getAllChar(done){
        const cache = {};
        const charList = [];
        const extNormalList = ['.ts', '.js', '.fire', '.prefab', '.json'];
        const extExcelList = ['.xlsx'];
        const extIgnore = {};

        async.eachOfSeries(this.allFilse, (file, index, cb)=>{
            const ext = path.extname(file);
            const basename = path.basename(file);
            if( basename.charAt(0) == '~' ){
                setImmediate(cb);
                return;
            }
            if( extNormalList.includes(ext) ){
                Editor.log(file);
                this.getChar(file);
                setImmediate(cb);
            }
            else if( extExcelList.includes(ext) ){
                Editor.log(file);
                this.getCharExcel(file, ()=>{
                    setImmediate(cb);
                });
            }
            else{
                extIgnore[ext] = true;
                setImmediate(cb);
            }
        }, ()=>{
            Editor.warn(Object.keys(extIgnore).join(''));
            done();
        });

    }

    getChar(file){
        const txt = fs.readFileSync(file).toString();
        this._fetchChr(txt);
    }

    getCharExcel(file, done){
        parseXlsx(file).then((data)=>{
            this._fetchChr(JSON.stringify(data));
            done();
        });
    }

    _fetchChr(txt){
        for(var i=0; i<txt.length; i++){
            const chr = txt.charAt(i);
            if( !this.cache[chr] ){
                this.cache[chr] = true;
                this.charList.push(chr);
            }
        }
    }

    sortAllChar(){
        this.charList.sort((a,b)=>{
            return a.localeCompare(b);
        });
    }

}

module.exports = function(){
    new Worker();
};