const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class JSONDatabase {
    constructor(filename) {
        this.filename = path.join('data', filename);
    }

    async read() {
        try {
            const data = await fs.readFile(this.filename, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, return empty array
                return [];
            }
            throw error;
        }
    }

    async write(data) {
        try {
            await fs.writeFile(this.filename, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing to ${this.filename}:`, error);
            throw error;
        }
    }

    async create(item) {
        const data = await this.read();
        const newItem = {
            id: uuidv4(),
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.push(newItem);
        await this.write(data);
        return newItem;
    }

    async findById(id) {
        const data = await this.read();
        return data.find(item => item.id === id);
    }

    async findBy(criteria) {
        const data = await this.read();
        return data.filter(item => {
            return Object.keys(criteria).every(key => {
                if (typeof criteria[key] === 'string') {
                    return item[key] && item[key].toLowerCase().includes(criteria[key].toLowerCase());
                }
                return item[key] === criteria[key];
            });
        });
    }

    async findOne(criteria) {
        const results = await this.findBy(criteria);
        return results[0] || null;
    }

    async update(id, updates) {
        const data = await this.read();
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) {
            return null;
        }

        data[index] = {
            ...data[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.write(data);
        return data[index];
    }

    async delete(id) {
        const data = await this.read();
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) {
            return false;
        }

        const deletedItem = data.splice(index, 1)[0];
        await this.write(data);
        return deletedItem;
    }

    async count() {
        const data = await this.read();
        return data.length;
    }

    async exists(criteria) {
        const item = await this.findOne(criteria);
        return !!item;
    }

    async paginate(page = 1, limit = 10, criteria = {}) {
        const data = await this.read();
        const filtered = criteria && Object.keys(criteria).length > 0 
            ? data.filter(item => {
                return Object.keys(criteria).every(key => {
                    if (typeof criteria[key] === 'string') {
                        return item[key] && item[key].toLowerCase().includes(criteria[key].toLowerCase());
                    }
                    return item[key] === criteria[key];
                });
            })
            : data;

        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const items = filtered.slice(offset, offset + limit);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }
}

// Database instances
const devicesDB = new JSONDatabase('devices.json');
const usersDB = new JSONDatabase('users.json');
const transfersDB = new JSONDatabase('transfers.json');
const reportsDB = new JSONDatabase('reports.json');

// Helper functions for backward compatibility
async function readData(type) {
    switch (type) {
        case 'users':
            return await usersDB.read();
        case 'devices':
            return await devicesDB.read();
        case 'transfers':
            return await transfersDB.read();
        case 'reports':
            return await reportsDB.read();
        default:
            throw new Error(`Unknown data type: ${type}`);
    }
}

async function writeData(type, data) {
    switch (type) {
        case 'users':
            return await usersDB.write(data);
        case 'devices':
            return await devicesDB.write(data);
        case 'transfers':
            return await transfersDB.write(data);
        case 'reports':
            return await reportsDB.write(data);
        default:
            throw new Error(`Unknown data type: ${type}`);
    }
}

module.exports = {
    JSONDatabase,
    devicesDB,
    usersDB,
    transfersDB,
    reportsDB,
    readData,
    writeData
};