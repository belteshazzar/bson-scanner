
import * as b from '../bson-scanner.js'
import {expect} from 'chai';


describe("simple scanning tests", function() {

    const doc = { lat : 32.0, lng: -151.3, re: /match/ig, name: "steve", b:  true, nl: null, un: undefined, subobj: { 'type': 'sub object' }, arr: [ 1,2,3 ], obj: { a: 3.14, b : [4,5,6], c: { boo: 3} } , final: 'woot'};
    const buffer = b.serialize(doc);

    it("should be able to add and complete TODOs", function() {

        
        
        b.scan(buffer,0, (name,index,type) => {
            console.log(name+':',b.read(buffer,index,type)) 
            return true;
        });
        
        expect(b.deserialize(buffer)).to.deep.equal(doc)
    });

    it("should be able to add and complete TODOs", function() {

        const deser = b.deserialize(buffer)
        const read = b.readObject(buffer,0)
        console.log("read object")
        console.log(read);
        console.log("original json")
        console.log(deser);

        expect(read).to.deep.equal(doc)
        expect(deser).to.deep.equal(doc)
    });

    it("query",function() {

        const key = 'name'

        function find(buffer,index,key) {
            let res = { index: -1, type: -1 }

            b.scan(buffer,0,(name,index,type) => {
                if (name === key) {
                    res.index = index
                    res.type = type
                    return false;
                } else {
                    return true;
                }
            });

            return res;
        }

        let r = find(buffer,0,key)
        console.log(b.read(buffer,r.index,r.type));


    });


    it("query - nested",function() {

        const key1 = 'obj'
        const key2 = 'b'
        const key3 = '1'

        function find(buffer,index,key) {
            let res = { index: -1, type: -1 }

            b.scan(buffer,index,(name,index,type) => {
                if (name === key) {
                    res.index = index
                    res.type = type
                    return false;
                } else {
                    return true;
                }
            });

            return res;
        }

        let r = find(buffer,0,key1)
        r = find(buffer,r.index,key2)
        r = find(buffer,r.index,key3)
        console.log(r)
        console.log(b.read(buffer,r.index,r.type))

    });

});

