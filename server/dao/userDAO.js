import mongodb from 'mongodb';
const { ObjectId, GridFSBucket } = mongodb;

export default class UserDAO {
  static users
  static gfs

  static async injectDB(conn) {
    if (this.users && this.gfs) {
      return
    }

    try {
      // Hardcoded to "test" as requested
      const dbName = "test";
      const db = conn.db(dbName); 
      
      this.users = await db.collection("users", {
        writeConcern: { w: "majority" }
      })
      this.gfs = new GridFSBucket(db, {
        bucketName: "photos",
        writeConcern: { w: "majority" }
      })
      console.log(`✅ UserDAO successfully connected to '${dbName}' database.`);
    } catch (err) {
      console.error(`❌ Failed to connect to DB in UserDAO: ${err}`)
    }
  }

  // --- THIS METHOD IS CORRECT ---
  static async getUsers({filter={}, page=0, limit=10}) {
    try {
      const cursor = await this.users.find(filter).skip(page*limit).limit(limit)
      return cursor.toArray()
    } catch (err) {
      console.error(`Failed to retrieve users: ${err}`)
      return []
    }
  }

  static async searchUsers({filter={}, searchQuery={}, page=0, limit=10}) {
    try {
      const cursor = await this.users.aggregate([
        { $match: filter },
        { $addFields: { fullName: { $concat: ["$firstName", " ", "$lastName"] } } }
      ])
      .match(searchQuery)
      .project({ fullName: 0 })
      .skip(page*limit)
      .limit(limit)
      return cursor.toArray()
    } catch (err) {
      console.error(`Failed to search users: ${err}`)
      return []
    }
  }

  static async getUser(username) {
    try {
      return await this.users.findOne({username: username})
    } catch (err) {
      console.error(`Failed to find user: ${err}`)
      return null
    }
  }

  static async addUser(userInfo) {
    try {
      const response = await this.users.insertOne({
        ...userInfo,
        isPhysician: Boolean(userInfo.isPhysician),
        dob: userInfo.dob ? new Date(userInfo.dob) : null,
        profilePhotoId: userInfo.profilePhotoId ? new ObjectId(userInfo.profilePhotoId) : null,
      }, { writeConcern: { w: "majority" } })
      return { success: true, id: response.insertedId }
    } catch (err) {
      console.error(`Failed to add user: ${err}`)
      return { error: err }
    }
  }

  static async deleteUser(username) {
    try {
      await this.users.deleteOne({username: username})
      return { success: true }
    } catch (err) {
      console.error(`Failed to delete user: ${err}`)
      return { error: err }
    }
  }

  static async updateUser(username, updateQuery) {
    try {
      const updateResponse = await this.users.updateOne(
        { username: username },
        { $set: {...updateQuery } }
      )
      return { success: true }
    } catch (err) {
      console.error(`Failed to update user: ${err}`)
      return { error: err }
    }
  }

  static async getPhoto(photoId) {
    try {
      return await this.gfs.openDownloadStream(new ObjectId(photoId))
    } catch (err) {
      console.error(`Failed to get photo: ${err}`)
      return null
    }
  }

  static async deletePhoto(photoId) {
    try {
      await this.gfs.delete(new ObjectId(photoId))
      return { success: true }
    } catch (err) {
      console.error(`Failed to delete photo: ${err}`)
      return { error: err }
    }
  }
}