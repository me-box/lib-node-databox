# app-hello-world

An example Databox app in Node.js


# To use 

Clone the git repo into the databox root directory 

     git clone https://github.com/me-box/lib-node-databox.git

Run the following commands in a terminal. To build the local databox image. 
 

```
cd ./lib-node-databox/samples/app-hello-world
docker build -t app-hello-world .
```
    
 Then run (If databox is not running)
 
      ./databox-start 
      
      
 
Next step is to open the local manifest server in a web brower by pointing this address
`http://127.0.0.1:8181
`
and upload app-manifest [/lib-node-databox/samples/app-hello-world/databox-manifest.json](./lib-node-databox/samples/app-hello-world/databox-manifest.json).
Once manifest is uploaded, close the the local manifest server by closing the browser.

If you point browser to databox user interface `https://127.0.0.1:8989`, you can see app-hello-world in the registered apps tabs. Now using databox user interface you can install app by clicking on the install button. 



     
     
 
   
