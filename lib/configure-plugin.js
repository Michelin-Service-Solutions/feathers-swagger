const utils = require('./utils')

module.exports = function (config) {
	return function (service, path) {
		const idName = service.id || 'id'
		service.docs = service.docs || {}

		// Skips internal feathers services (authentication)
		if (service.Model) {
			service.docs.definitions = Object.assign({}, service.docs.definitions,
				utils.generateDefinitions({
					name: service.name,
					Model: service.Model,
					paginate: this.get('paginate')
				}))
		}

		// Load documentation from service, if available.
		const doc = service.docs
		const idType = doc.idType || 'integer'
		let version = config.versionPrefix ? path.match(config.versionPrefix) : null
		version = version ? ' ' + version[0] : ''
		const apiPath = path.replace(config.prefix, '')
		const group = apiPath.split('/')
		const tag = (apiPath.indexOf('/') > -1 ? group[0] : apiPath) + version
		const model = apiPath.indexOf('/') > -1 ? group[1] : apiPath
		const security = [{'jwt': []}]
		const ignore = config.ignore || {}
		// Load app.docs
		const rootDoc = this.docs

		if (ignore.hasOwnProperty('tags') &&
			ignore.tags.constructor === Array &&
			ignore.tags.indexOf(tag) > -1) {
			return
		}

		const pathObj = rootDoc.paths
		const withIdKey = `/${path}/{${idName}}`
		const withoutIdKey = `/${path}`

		if (typeof doc.definition !== 'undefined') {
			rootDoc.definitions[tag] = doc.definition
			rootDoc.definitions[`${tag}List`] = {
				type: 'array',
				items: doc.definition
			}
		}
		if (typeof doc.definitions !== 'undefined') {
			rootDoc.definitions = Object.assign(rootDoc.definitions, doc.definitions)
		}

		// FIND
		if (typeof service.find === 'function') {
			pathObj[withoutIdKey] = pathObj[withoutIdKey] || {}

			let parameters = [
				{
					name: '$limit',
					description: 'Number of results to return',
					in: 'query',
					type: 'integer'
				},
				{
					name: '$skip',
					description: 'Number of results to skip',
					in: 'query',
					type: 'integer'
				},
				{
					name: '$sort',
					description: 'Sorting operation (ex _$sort[propertyName]=1_). 1 ascending, -1 descending',
					in: 'query',
					type: 'object'
				}
			]

			let associations = utils.getAssociationList(service.Model)
			if (associations && associations.length) {
				parameters.push({
					name: '$include',
					description: `Include associated elements. Nested objects can by included by seperating levels with periods (ex _$include=level1.level2.level3_)
Includable elements:
> _${associations.join(', ')}_`,
					in: 'query',
					type: 'array',
					items: {
						type: 'string'
					},
					collectionFormat: 'multi'
				})
			}

			pathObj[withoutIdKey].get = utils.operation('find', service, {
				tags: [tag],
				description: 'Retrieves a list of all resources from the service.',
				parameters: parameters,
				responses: {
					'200': {
						description: 'success',
						schema: {
							'$ref': '#/definitions/' + `${tag}List`
						}
					},
					'500': {
						description: 'general error'
					},
					'401': {
						description: 'not authenticated'
					}
				},
				produces: rootDoc.produces,
				consumes: rootDoc.consumes,
				security: security
			})
		}

		// GET
		if (typeof service.get === 'function') {
			pathObj[withIdKey] = pathObj[withIdKey] || {}
			pathObj[withIdKey].get = utils.operation('get', service, {
				tags: [tag],
				description: 'Retrieves a single resource with the given id from the service.',
				parameters: [{
					name: idName,
					description: `ID of ${model} to return`,
					in: 'path',
					required: true,
					type: idType
				}],
				responses: {
					'200': {
						description: 'success',
						schema: {
							'$ref': '#/definitions/' + tag
						}
					},
					'500': {
						description: 'general error'
					},
					'401': {
						description: 'not authenticated'
					},
					'404': {
						description: 'not found'
					}
				},
				produces: rootDoc.produces,
				consumes: rootDoc.consumes,
				security: security
			})
		}

		// CREATE
		if (typeof service.create === 'function') {
			pathObj[withoutIdKey] = pathObj[withoutIdKey] || {}
			pathObj[withoutIdKey].post = utils.operation('create', service, {
				tags: [tag],
				description: 'Creates a new resource with data.',
				parameters: [{
					name: 'body',
					in: 'body',
					required: true,
					schema: {
						'$ref': '#/definitions/' + tag
					}
				}],
				responses: {
					'201': {
						description: 'created'
					},
					'500': {
						description: 'general error'
					},
					'401': {
						description: 'not authenticated'
					}
				},
				produces: rootDoc.produces,
				consumes: rootDoc.consumes,
				security: security
			})
		}

		// UPDATE
		if (typeof service.update === 'function') {
			pathObj[withIdKey] = pathObj[withIdKey] || {}
			pathObj[withIdKey].put = utils.operation('update', service, {
				tags: [tag],
				description: 'Updates the resource identified by id using data.',
				parameters: [{
					name: idName,
					description: 'ID of ' + model + ' to return',
					in: 'path',
					required: true,
					type: idType
				}, {
					name: 'body',
					in: 'body',
					required: true,
					schema: {
						'$ref': '#/definitions/' + tag
					}
				}],
				responses: {
					'200': {
						description: 'success',
						schema: {
							'$ref': '#/definitions/' + tag
						}
					},
					'500': {
						description: 'general error'
					},
					'401': {
						description: 'not authenticated'
					},
					'404': {
						description: 'not found'
					}
				},
				produces: rootDoc.produces,
				consumes: rootDoc.consumes,
				security: security
			})
		}

		// PATCH
		if (typeof service.patch === 'function') {
			pathObj[withIdKey] = pathObj[withIdKey] || {}
			pathObj[withIdKey].patch = utils.operation('patch', service, {
				tags: [tag],
				description: 'Updates the resource identified by id using data.',
				parameters: [{
					name: idName,
					description: 'ID of ' + model + ' to return',
					in: 'path',
					required: true,
					type: idType
				}, {
					name: 'body',
					in: 'body',
					required: true,
					schema: {
						'$ref': '#/definitions/' + tag
					}
				}],
				responses: {
					'200': {
						description: 'success',
						schema: {
							'$ref': '#/definitions/' + tag
						}
					},
					'500': {
						description: 'general error'
					},
					'401': {
						description: 'not authenticated'
					},
					'404': {
						description: 'not found'
					}
				},
				produces: rootDoc.produces,
				consumes: rootDoc.consumes,
				security: security
			})
		}

		// REMOVE
		if (typeof service.remove === 'function') {
			pathObj[withIdKey] = pathObj[withIdKey] || {}
			pathObj[withIdKey].delete = utils.operation('remove', service, {
				tags: [tag],
				description: 'Removes the resource with id.',
				parameters: [{
					name: idName,
					description: 'ID of ' + model + ' to return',
					in: 'path',
					required: true,
					type: idType
				}],
				responses: {
					'200': {
						description: 'success',
						schema: {
							'$ref': '#/definitions/' + tag
						}
					},
					'500': {
						description: 'general error'
					},
					'401': {
						description: 'not authenticated'
					},
					'404': {
						description: 'not found'
					}
				},
				produces: rootDoc.produces,
				consumes: rootDoc.consumes,
				security: security
			})
		}

		rootDoc.paths = pathObj

		const existingTag = rootDoc.tags.find(item => item.name === tag)
		if (!existingTag) {
			rootDoc.tags.push(utils.tag(tag, doc))
		} else {
			Object.assign(existingTag, utils.tag(tag, doc))
		}
	}
}