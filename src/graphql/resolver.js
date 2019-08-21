import graphqlHTTP from 'express-graphql';
import { customFormatErrorFn } from './formatError';

function sendError(originalError, responce) {
  customFormatErrorFn({ originalError })
  |> responce.json({
    errors: [#]
  });
}

function assignFiles(value, blobsMap, files) {
  for (let blobIndex = 0; blobIndex < blobsMap.length; blobIndex++) for (const blobKeyPath of blobsMap[blobIndex]) {
    const { mimetype, buffer } = files[blobIndex];
    let _value = value;
    const lastIndex = blobKeyPath.length - 1;
    for (let index = 0; index < lastIndex; index++) {
      _value = _value[blobKeyPath[index]];
    }
    _value[blobKeyPath[lastIndex]] = { mimetype, buffer };
  }
  return value;
}

export function graphqlResolver(schema, loaders, options) {

  const _options = async function(request, responce) {

    try {

      const [context, extensions] = await options(request);
      for (const [name, loader] of Object.entries(loaders)) {
        context[name] = loader.bind(context);
      }

      return {
        schema,
        context,
        extensions,
        customFormatErrorFn
      };

    } catch (error) {
      sendError(error, responce);
    }
    
  };
  const graphqlMiddleware = graphqlHTTP(_options);

  return async function (request, responce) {

    try {
      let variables = JSON.parse(request.body.variables);
      const blobsMap = JSON.parse(request.body.blobsMap);
      variables = assignFiles(variables, blobsMap, request.files);
      request.body.variables = variables;
      await graphqlMiddleware(request, responce);
    } catch(error) {
      sendError(error, responce);
    }
  };

}

// export function graphqlResolver(schema, loaders, options) {

//   const _this = {};
//   const _options = async function(request, responce) {

//     try {

//       const [context, extensions] = await options(request);
//       for (const [name, loader] of Object.entries(loaders)) {
//         context[name] = loader.bind(context);
//       }

//       context.files = request.files.map(toContextFiles);

//       return {
//         schema,
//         context,
//         extensions,
//         customFormatErrorFn
//       };

//     } catch (error) {

//       sendError(error, responce);
//       _this.responce.setHeader = () => undefined;
//       //_this.responce.json = undefined;
//       _this.responce.end = () => undefined;
//       _this.end();
//       //_this.next();
//     }
    
//   };
//   const graphqlMiddleware = graphqlHTTP(_options);

//   return async function (request, responce, next) {

//     _this.next = next;
//     _this.responce = responce;
//     _this.setHeader = responce.setHeader;
//     //_this.json = responce.json;
//     _this.end = responce.end;

//     try {
//       await graphqlMiddleware(request, _this.responce);
//     } catch(error) {
//       sendError(error, responce);
//     } finally {
//       _this.responce.setHeader = _this.setHeader;
//       //_this.responce.json = _this.json;
//       _this.responce.end = _this.end;
//     }
//   };

// }