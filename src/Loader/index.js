import { BoundLoader } from './BoundLoader';

function reduceEqualKeys(keys) {
  const uniqueKeys = [];
  for (const key in keys) if (!uniqueKeys.includes(key)) uniqueKeys.push(key);
  return uniqueKeys;
}

class LoaderCreator {
  constructor(batchLoadFn, context, name) {
    this.batchLoadFn = batchLoadFn;
    this.context = context;
    this.name = name;
  }

  createBoundLoader() {
    this.context[this.name] = new BoundLoader(this.batchLoadFn, this.context);
  }

  load(key, loadInfo) {
    this.createBoundLoader();
    return this.context[this.name].load(key, loadInfo);
  }

  loadMany(keys, loadInfo) {
    this.createBoundLoader();
    return this.context[this.name].loadMany(keys, loadInfo);
  }
}

export class Loader {

  constructor(batchLoadFn, collateFn) {
    this.load = batchLoadFn;
    this.collate = collateFn;
    this.batchLoadFn = this.batchLoadFn.bind(this);
  }

  bindToContext(context, name) {
    return new LoaderCreator(this.batchLoadFn, context, name);
    //return new BoundLoader(this.batchLoadFn, context);
  }

  async batchLoadFn(keys, context, loadInfo) {

    const uniqueKeys = reduceEqualKeys(keys);
    const data = await this.load(uniqueKeys, context, loadInfo);
    return this.collate(data, keys);
  }
}