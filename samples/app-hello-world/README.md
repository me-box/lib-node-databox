# app-hello-world

An example Databox app in Node.js


# To use 

Clone the git repo into the databox root directory 

     git clone https://github.com/me-box/lib-node-databox.git

Add the below to the end of docker-compose-dev-local-images.yaml (White space is important)

     app-hello-world:
         build:
             context: ./lib-node-databox/samples/app-hello-world
             dockerfile: Dockerfile${DATABOX_ARCH}
         image: app-hello-world
         
 Then run 
 
      ./databox-start dev 
      
This will build all the local databox images and set up the local app store. 
 
Next step is to open the local manifest server in a web brower by pointing this address
`http://127.0.0.1:8181
`
and upload app-manifest [/lib-node-databox/samples/app-hello-world/databox-manifest.json]().
Once manifest is uploaded, close the the local manifest server by closing the browser.

If you point browser to databox user interface 'http://127.0.0.1:8989', you can see app-hello-world in the registered apps tabs. Now using databox user interface you can install app by clicking on the install button. 



     
     
 
   
