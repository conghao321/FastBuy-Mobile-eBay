const express = require('express');
var cors = require('cors');
const app = express();
app.use(cors());//we use this to tackle cors problem
const got = require('got');
const router = require('express-promise-router');
app.use(router());

/*
Router1 : to Fetch item's list:
*/
//our router
app.get('/itemsList', cors(),(req, res)=>{

    keyWord=req.query['keyWord'];
    price1=req.query['price1'];
    price2=req.query['price2'];
    newItem=req.query['newItem'];
    used=req.query['used'];
    good=req.query['good'];
    veryGood=req.query['veryGood'];
    acceptable=req.query['acceptable'];
    unspec=req.query['unspec'];
    canReturn=req.query['canReturn'];
    free=req.query['free'];
    expedited=req.query['expedited'];
    sortBy=req.query['sortBy'];       
    url=getUrl();
    console.log(url);

    //the real difficult part--promising async part call API
    (async () => {
        try {
            //we need to use await to get a promise object
            const {body} = await got.get(url, {
                responseType: 'json'
            });
            data=body.findItemsAdvancedResponse[0].searchResult;
            objects=data[0].item;
            count=Number(data[0]['@count']);
            console.log(body);
            obj_list=returnRes(count,objects);
            res.status(200).send(obj_list).end();

        } catch (error) {
            //we must use try-catch block to make sure we can
            //avoid any uncaught error message, this is mandatory.
            console.log(error);
            res.status(500).send(error).end();
        }
    })();
});


//main function to send request to eBay
function getUrl(){
    this.value=null;
    url = 'https://svcs.ebay.com/services/search/FindingService/v1?';
    url+=mainParams();
    url+=filterUrl(this.price1,this.price2,this.newItem,
        this.used,this.veryGood,this.good,this.acceptable,this.canReturn,this.free,this.expedited,this.sortBy,this.unspec);
    
    return url;  
}
//to get the main url and append the filters
function mainParams(){
    params = new URLSearchParams('');
    paramsDict={'OPERATION-NAME':'findItemsAdvanced','SERVICE-VERSION':'1.0.0',
        'SECURITY-APPNAME':'haocong-laodashi-PRD-32eb6beb6-89281c37','RESPONSE-DATA-FORMAT':'JSON','REST-PAYLOAD':'',
        'keywords':this.keyWord,'paginationInput.entriesPerPage':'100'};
    
    for (let key of Object.keys(paramsDict)) {
        let val = paramsDict[key];
        params.append(key,val);
    }

    return params.toString();
}

//to get the filters by ebayApi
function filterUrl(
    priceMin,priceMax,newItem,usedItem,
    veryGoodItem,goodItem,acceptableItem,
    returnAccepted,freeShipping,expShipping,
    sortBy,unspec){

        filter_url='&sortOrder='+sortBy;
        filter_counter=0;

        if(priceMin=='null'){
            priceMin='0';
        }
        if(priceMax=='null'){
            priceMax=String(Number.MAX_SAFE_INTEGER);
        }

        if(priceMax!=''){
            filter_url+='&itemFilter('+String(filter_counter)+').name=MaxPrice&itemFilter('+String(filter_counter)+').value='+priceMax+'&itemFilter('+String(filter_counter)+').paramName=Currency&itemFilter('+String(filter_counter)+').paramValue=USD';
            filter_counter+=1;
        }
        if(priceMin!=''){
            filter_url+='&itemFilter('+String(filter_counter)+').name=MinPrice&itemFilter('+String(filter_counter)+').value='+priceMin+'&itemFilter('+String(filter_counter)+').paramName=Currency&itemFilter('+String(filter_counter)+').paramValue=USD'
            filter_counter+=1
        }
        if(returnAccepted=='true'){
            filter_url+='&itemFilter('+String(filter_counter)+').name=ReturnsAcceptedOnly&itemFilter('+String(filter_counter)+').value='+returnAccepted
            filter_counter+=1
        }
        if(freeShipping=='true'){
            filter_url+='&itemFilter('+String(filter_counter)+').name=FreeShippingOnly&itemFilter('+String(filter_counter)+').value='+freeShipping
            filter_counter+=1
        }
        if(expShipping=='true'){
            filter_url+='&itemFilter('+String(filter_counter)+').name=ExpeditedShippingType&itemFilter('+String(filter_counter)+').value=Expedited'
            filter_counter+=1
        }
        if(newItem=='true' || usedItem=='true' || veryGoodItem=='true' || goodItem=='true' || acceptableItem=='true'){
            filter_url+='&itemFilter('+String(filter_counter)+').name=Condition'
            condition_counter=0;
            if(newItem=='true'){
                filter_url+='&itemFilter('+String(filter_counter)+').value('+String(condition_counter)+')=New'
                condition_counter+=1
            }
            if(usedItem=='true'){
                filter_url+='&itemFilter('+String(filter_counter)+').value('+String(condition_counter)+')=Used'
                condition_counter+=1
            }

            if(acceptableItem=='true'){
                filter_url+='&itemFilter('+String(filter_counter)+').value('+String(condition_counter)+')=6000'
                condition_counter+=1 
            }

            if(unspec=='true'){
                filter_url+='&itemFilter('+String(filter_counter)+').value('+String(condition_counter)+')=Unspecified'
                condition_counter+=1 
            }
        }                   
        return filter_url
}

//we use this method to return a counted and filtered result list
function returnRes(count,objects){
    var count=Number(count);
    var items_list=objects;

    obj_list=[] ;
    var effective=0;//to make sure how many items are exactly useful
    for(var i=0;i<count;i++){
        let item={};
        try {
            item['id']=items_list[i]['itemId'][0];
            item['title']=items_list[i]['title'][0];
            item['price']=items_list[i]['sellingStatus'][0]['convertedCurrentPrice'][0]['__value__']
            try{
                item['imageURL']=items_list[i]['galleryURL'][0]
                
            }catch(error){
                item['imageURL']='https://thumbs1.ebaystatic.com/pict/04040_0.jpg';
            }  
            item['location']=items_list[i]['location'][0];
            item['currency']=items_list[i]['sellingStatus'][0]['convertedCurrentPrice'][0]['@currencyId']
            item['category']=items_list[i]['primaryCategory'][0]['categoryName'][0]
            item['productLink']=items_list[i]['viewItemURL'][0]
            item['condition']=items_list[i]['condition'][0]['conditionDisplayName'][0]
            item['shippingCost']=items_list[i]['shippingInfo'][0]['shippingServiceCost'][0]['__value__']
            item['shippingType']=items_list[i]['shippingInfo'][0]['shippingType'][0]
            item['topRated']=items_list[i]['topRatedListing'][0]
            item['handle']=item['shippingType']=items_list[i]['shippingInfo'][0]['handlingTime'][0]
            item['shipToLocations']=items_list[i]['shippingInfo'][0]['shipToLocations'][0]
            item['expedited']=items_list[i]['shippingInfo'][0]['expeditedShipping'][0]
            item['oneDay']=items_list[i]['shippingInfo'][0]['oneDayShippingAvailable'][0]
            item['shippingInfo']=items_list[i]['shippingInfo'][0];
                       
            obj_list.push(item);
            effective++;
            if(effective==50){
                break;
            }
        } catch (err) {   
            continue;        
        }
    }
    console.log("effective items number is : "+effective);
    return obj_list;
}



/*
Router 2: single item API
*/

app.get('/itemCard', cors(),(req, res)=>{

    id=req.query['id'];
    console.log(id);   
    var itemUrl=getItemUrl(id);
    console.log(itemUrl);
    //the real difficult part--promising async part call API
    (async () => {
        try {
            //we need to use await to get a promise object
            const {body} = await got.get(itemUrl, {
                responseType: 'json'
            });
            obj=body['Item'];
            
            item_info=returnItemRes(obj);
            res.status(200).send(item_info).end();

        } catch (error) {
            //we must use try-catch block to make sure we can
            //avoid any uncaught error message, this is mandatory.
            console.log(error);
            res.status(500).send(error).end();
        }
    })();
});

//main function to send request to eBay
function getItemUrl(id){
    return "http://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=haocong-laodashi-PRD-32eb6beb6-89281c37&siteid=0&version=967&ItemID="+id+"&IncludeSelector=Description,Details,ItemSpecifics";
}

function returnItemRes(obj){

    let item={};
    
    item['id']=obj['ItemID'];
    item['title']=obj['title'];
    item['price']=obj['price'];
    item['location']=obj['location'];
    item['imgsURL']=obj['PictureURL'];
    
    
    try {
        item['subtitle']=obj['Subtitle'];
    } catch (error) {
        item['subtitle']="";
    }

    try {
        item['brand']=obj['Brand'];
    } catch (error) {
        item['brand']="";
    }   

    try {
        item['nameList']=obj['ItemSpecifics']['NameValueList'];
    } catch (error) {
        item['nameList']="";
    }   
    item['seller']=obj['Seller'];
    item['return']=obj['ReturnPolicy'];

    return item;
}



// Start the server, refer to google cloud platform documentation
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_flex_quickstart]

module.exports = app;