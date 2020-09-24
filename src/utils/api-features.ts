import { Query } from 'mongoose';

class APIFeatures {
	constructor(public query: Query<any>, public queryString: any) {}

	/**
	 * FILTERING
	 */
	filter() {
		const queryObj = { ...this.queryString };
		// Filtering
		const excludedFields = ['page', 'sort', 'limit', 'fields'];
		excludedFields.forEach((el) => delete queryObj[el]);

		let queryStr = JSON.stringify(queryObj);
		queryStr = queryStr.replace(
			/\b(gte|gt|lte|lt)\b/g,
			(match) => `$${match}`
		);

		this.query = this.query.find(JSON.parse(queryStr));

		return this;
	}

	/**
	 * SORTING
	 */
	sort() {
		if (this.queryString.sort) {
			const sortBy = this.queryString.sort.split(',').join(' ');
			this.query = this.query.sort(sortBy);
		} else {
			this.query = this.query.sort('-createdAt');
		}

		return this;
	}

	/**
	 * LIMIT FIELDS
	 */
	limitFields() {
		if (this.queryString.fields) {
			const fields = this.queryString.fields.split(',').join(' ');
			this.query = this.query.select(fields);
		} else {
			this.query = this.query.select('-__v');
		}

		return this;
	}

	/**
	 * PAGINATE
	 */
	paginate() {
		const page = this.queryString.page * 1 || 1;
		const limit = this.queryString.limit * 1 || 100;
		// -- skip implies the no. of documents to skip
		const skip = (page - 1) * limit;

		this.query = this.query.skip(skip).limit(limit);

		return this;
	}
}

export { APIFeatures };
