import Debug from 'debug'
const debug = Debug('MIDI.js:src/JobCollection.js')

import dump from './dump'
import {map} from "./fn"

export default class JobCollection {
	constructor() {
		this.jobs = new Set()
		this.jobMetadata = new WeakMap()
		this.completedJobs = new Set()
	}

	track(job, ...tags) {
		this.jobs.add(job)
		this.jobMetadata.set(job, {status: 'pending', tags})
		job.then(() => {
			this.jobs.delete(job)
			this.completedJobs.add(job)
			this.jobMetadata.get(job).status = 'resolved'
		}).catch(error => {
			this.jobMetadata.get(job).status = `rejected: ${error}`
		})
	}

	waitForActiveJobs(options = {}) {
		let except = options.except || []
		if (!Array.isArray(except))
			except = [except]

		const jobs = Array.from(this.jobs.values()).filter((job) => {
			const {tags} = this.jobMetadata.get(job)
			return !except.some((tag) => tags.indexOf(tag) !== -1)
		})

		if (jobs.length) {
			return Promise.all(jobs).then(() => this.waitForActiveJobs({except}))
		}
		return Promise.resolve()
	}

	dump() {
		const getRows = (jobSet) => {
			return map(jobSet, (job) => {
				const {status, tags} = this.jobMetadata.get(job)
				return {status, tags: tags.join(', ')}
			})
		}

		dump(...getRows(this.jobs), ...getRows(this.completedJobs))
	}

	flushCompletedJobs() {
		this.completedJobs.clear()
	}
}