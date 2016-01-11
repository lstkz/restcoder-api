# Hello world

Create a simple route `GET /hello`, which will return plain text `world`.

---------------------------------------

####Example
**Request**:  
Request URL: `/hello`  
Request Method: `GET`  

**Response**:  
Status Code: `200`  
Response headers:
- Content-Length: `5`  
- Content-Type: `text/html; charset=utf-8`  

Response body: `world`

---------------------------------------

####Environmental Variables
- `PORT` the port to listen (example `5000`)

---------------------------------------
####Notes
- Your program must write `READY` to standard output after your server is ready to receive HTTP requests. Timeout is 3s.