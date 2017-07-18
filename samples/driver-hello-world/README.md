# driver-hello-world

A helloworld driver for databox


# To use 

Clone the git repo into the databox root directory 

     git clone https://github.com/me-box/lib-node-databox.git

Add the below to the end of docker-compose-dev-local-images.yaml (White space is important)

     driver-hello-world:
         build:
             context: ./lib-node-databox/samples/driver-hello-world
             dockerfile: Dockerfile${DATABOX_ARCH}
         image: driver-hello-world
         
 Then run 
 
      ./startDatbox.sh dev 
      
This will build all the local databox images and set up the local app store. 
 
Finaly upload the manifest file:
 
     go to http://127.0.0.1:8181 in a web browser
     
     select upload and chose /lib-node-databox/samples/driver-hello-world/databox-manifest.json
     
     
 
   

