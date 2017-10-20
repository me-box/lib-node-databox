# driver-hello-world

A helloworld driver for databox


# To use 

Clone the git repo into the databox root directory 

     git clone https://github.com/me-box/lib-node-databox.git

Run the following commands in a terminal. To build the local databox image. 
 

```
cd ./lib-node-databox/samples/driver-hello-world
docker build -t driver-hello-world .
```
    
 Then run (If databox is not running)
 
      ./databox-start 
      
      
This will build all the local databox images and set up the local app store.

Next step is to open the local manifest server in a web brower by pointing this address http://127.0.0.1:8181 and upload app-manifest /lib-node-databox/samples/driver-hello-world/databox-manifest.json. Once manifest is uploaded, close the the local manifest server by closing the browser.

If you point browser to databox user interface https://127.0.0.1:8989, you can see driver-hello-world in the registered drivers tabs. Now using databox user interface you can install  the driver by clicking on the install button.
