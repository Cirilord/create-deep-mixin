'use strict'

module.exports = (model, options) => {

    const createDeep = async (model, data) => {

        const relations = model.settings.relations
            , hasMany = {}
            , belongsTo = {}

        if (relations && Object.keys(relations).length) {

            for (const key in relations) {

                const relation = relations[key]
                    , father = data.$$father || data

                if (relation.type === 'belongsTo') {

                    data[key].$$father = data

                    try {

                        const createBelongsTo = await createDeep(model.app.models[relation.model], data[key])

                        father[relation.foreignKey] = createBelongsTo.id

                        belongsTo[key] = createBelongsTo.__data

                        delete father[key]
                    }
                    catch (error) {

                        throw error
                    }
                }
                else if (relation.type === 'hasMany' && data[key]) {

                    hasMany[key] = { data: Object.assign([], data[key], []), model: relation.model }

                    delete data[key]
                }
            }
        }

        delete data.$$father

        try {

            const createModel = await model.create(data)

            for (const relation in belongsTo)
                createModel.__data[relation] = belongsTo[relation]

            for (const key in hasMany) {

                const modelHasMany = model.app.models[hasMany[key].model]

                try {

                    hasMany[key].data.forEach(res => {

                        res[model.settings.relations[key].foreignKey] = createModel.id

                        delete res.id
                    })

                    const createHasMany = await modelHasMany.create(hasMany[key].data)

                    createModel.__data[key] = createHasMany
                }
                catch (error) {

                    throw error
                }
            }

            return createModel
        }
        catch (error) {

            return error
        }
    }

    model.createDeep = async (data, callback = null) => {

        try {

            const create = await createDeep(model, data)

            if (typeof callback === 'function')
                callback(null, create)

            return create
        }
        catch (error) {

            if (typeof callback === 'function')
                callback(error)

            return error
        }
    }
}