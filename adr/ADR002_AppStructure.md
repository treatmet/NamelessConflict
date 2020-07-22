# App Structure

## Directory Structure

 - `server/`
    - `admin/`
      - `routes/`
      - `app.js`
      - `package.json`
    - `game/`
      - `config.js`
      - `app.js`
      - `package.json`
    - `shared/`
      - `data_access/`
      - `helperFunctions.js`
 - `client/`
   - `pages/`
     - `home.html`
   - `package.json`
 - `shared/`
    - `entities/`
    - `engines/`
    
    
    The only problem I ran into when trying to implement this structure was that the .js files in the /shared directory do not have access to the node_modules folder found inside either /admin or /game, since they are adjacent to those directories. (server/shared/data_access/dataAccess.js is not able to see into server/web/node_modules and it needs require(mongojs) for example). Require is not smart enough to know the root app.js folder when looking for node_modules. It just looks in the directory of whatever file it is in when it is called.
    
    For now, I've left the node_modules folder in the top root directory so everyone can see it. You can look at the branch "client-code-refactor" to see. Any thoughts on this?
