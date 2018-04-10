import * as mongoose from "mongoose";
import * as _ from "lodash";
import { Document, Schema } from "mongoose";
import { Observable } from "rx";
import { UpdateResponse } from "./Constants";
import { Tutor, UserManager } from "./UserManager";

/**
 * Define enum for status available in workflow node
 * 
 * @export
 * @enum {number}
 */
export enum Status {
    NONE = "none",
    NOTE = "note",
    TODO = "todo",
    IN_PROGRESS = "inprogress",
    ASSIGN = "assign",
    DONE = "done",
    COMPLETE = "complete"
}

/**
 * Decalre interface for node
 * 
 * @export
 * @interface NodeInterface
 * @extends {Document}
 */
interface NodeInterface extends Document {
    header: Boolean,
    timestamp: Date,
    createdBy: Number
}

/**
 * Decalre interface for header node
 * 
 * @export
 * @interface HeaderInterface
 * @extends {Node}
 */
export interface HeaderInterface extends NodeInterface {
    title: String,
    tag: String
}

/**
 * Decalre interface for body node
 * 
 * @export
 * @interface BodyNode
 * @extends {Node}
 */
export interface BodyInterface extends NodeInterface {
    duedate?: Date,
    status: String,
    owner: Number,
    subtitle: String,
    detail: String,
    parent?: mongoose.Types.ObjectId,
    ancestors?: mongoose.Types.ObjectId[]
}

/**
 * Create mongoose schema
 */
let headerSchema = new Schema({
    header: {
        type: Boolean,
        default: true
    },
    timestamp: {
        type: Date,
        default: new Date()
    },
    createdBy: Number,
    title: String,
    tag: String
});

let nodeSchema = new Schema({
    header: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: new Date()
    },
    createdBy: Number,
    duedate: {
        type: Date,
        default: null
    },
    status: String,
    owner: Number,
    subtitle: String,
    detail: String,
    parent: {
        type: Schema.Types.ObjectId,
        default: null
    },
    ancestors: {
        type: [Schema.Types.ObjectId],
        default: []
    }
});

/**
 * Create model from schema
 */
let HeaderModel = mongoose.model<HeaderInterface>("Header", headerSchema, "workflow");
let NodeModel = mongoose.model<BodyInterface>("Node", nodeSchema, "workflow");

abstract class Node<T extends NodeInterface> {

    protected node: T

    constructor(node: T) {
        this.node = node;
    }

    getID(): mongoose.Types.ObjectId {
        return this.node._id;
    }

    getCreatedUser(): Observable<Tutor> {
        return UserManager.getTutorInfo(this.node.createdBy.valueOf());
    }

    getChild(): Observable<BodyNode[]> {
        return Observable.fromPromise(NodeModel.find({
            ancestors: this.getID
        })).map(nodes => nodes.map(node => new BodyNode(node)));
    }

    getInterface(): T {
        return this.node;
    }

    getTimestamp(): Date {
        return this.node.timestamp;
    }

    getCreatedBy(): number {
        return this.node.createdBy.valueOf();
    }
}

export class HeaderNode extends Node<HeaderInterface> {

    constructor(header: HeaderInterface) {
        super(header);
    }

    setTitle(title: string): Observable<HeaderNode> {
        return Observable.fromPromise(HeaderModel.findByIdAndUpdate(this.getID(), {
            $set: {
                title: title
            }
        })).map(header => new HeaderNode(header));
    }

}

export class BodyNode extends Node<BodyInterface> {

    constructor(body: BodyInterface) {
        super(body);
    }

    getParentID(): mongoose.Types.ObjectId {
        return this.node.parent;
    }

    getAncestors(): mongoose.Types.ObjectId[] {
        return this.node.ancestors;
    }

    getHeaderID(): mongoose.Types.ObjectId {
        return this.getAncestors()[0];
    }

    getStatus(): string {
        return this.node.status.valueOf();
    }

    getOwner(): number {
        return this.node.owner.valueOf();
    }

    getDuedate(): Date {
        return this.node.duedate;
    }

    getSubtitle(): string {
        return this.node.subtitle.valueOf();
    }

    getDetail(): string {
        return this.node.detail.valueOf();
    }

    getOwnerDetail(): Observable<Tutor> {
        return UserManager.getTutorInfo(this.getOwner());
    }

    appendWithStatus(status: string): Observable<BodyNode>{
        return WorkflowManager.clone(this).flatMap(newNode => {
            return newNode.setStatus(status);
        }).flatMap(newNode => {
            return newNode.setParent(this);
        });
    }

    setParent(parentNode: BodyNode): Observable<BodyNode> {
        let ancestors = parentNode.getAncestors();
        ancestors.push(parentNode.getID());
        this.node.ancestors = ancestors;
        return this.edit({
            parent: parentNode.getID(),
            ancestors: ancestors
        });
    }

    getParent(): Observable<BodyNode> | Observable<null> {
        return this.isParentHeader().flatMap(isHeader => {
            if (isHeader) {
                return null;
            } else {
                return Observable.fromPromise(NodeModel.findById(this.getParentID())).map(parent => new BodyNode(parent));
            }
        });
    }

    getHeader(): Observable<HeaderNode> {
        return Observable.fromPromise(HeaderModel.findById(this.getHeaderID())).map(header => new HeaderNode(header));
    }

    private edit(value: any): Observable<BodyNode> {
        return Observable.fromPromise(NodeModel.findByIdAndUpdate(this.getID(), {
            $set: value
        })).map(node => new BodyNode(node));
    }

    isParentHeader(): Observable<boolean> {
        return Observable.fromPromise(NodeModel.findById(this.getID())).map(parent => {
            return parent.header.valueOf()
        });
    }

    setSubtitle(subtitle: string): Observable<BodyNode> {
        return this.edit({
            subtitle: subtitle
        });
    }

    setDuedate(duedate: Date): Observable<BodyNode> {
        return this.edit({
            duedate: duedate
        });
    }

    setStatus(status: string): Observable<BodyNode> {
        return this.edit({
            status: status
        });
    }

    getTree(): Observable<BodyNode[]> {
        return this.getHeader().flatMap(header => {
            return Observable.fromPromise(NodeModel.find({
                ancestors: header.getID()
            }))
        }).map(nodes => nodes.map(node => new BodyNode(node)));
    }

    getParentBranch(): Observable<BodyNode[]> {
        return this.getTree().map(bodynodes => {
            return _.dropRightWhile(bodynodes, o => {
                return o.getID() !== this.getID()
            });
        });
    }

    getBranchParent(): Observable<BodyNode> {
        return this.getTree().map(bodynodes => {
            bodynodes = _.dropRightWhile(bodynodes, o => {
                return o.getID() !== this.getID()
            });
            let returnNode: BodyNode;
            _.forEachRight(bodynodes, node => {
                if (node.getOwner() != this.getOwner()) {
                    returnNode = node;
                }
            });
            return returnNode;
        });
    }
    
}

/**
 * Class provide method for handle all workflow database operation
 * 
 * @export
 * @class WorkflowManager
 */
export class WorkflowManager {

    /**
     * This method create header and body node
     * 
     * @static
     * @param {number} userID id of creater of workflow
     * @param {string} title title of the workflow
     * @param {string} subtitle subtitle of the workflow
     * @param {string} [detail] detail of the workflow put in body node
     * @param {string} [tag] tag of the workflow put in body node
     * @param {Date} [duedate] duedate of the workflow in body node
     * @returns {Observable<BodyNode>} the body node after appened to the header node
     * @memberof WorkflowManager
     */
    static create(userID: number,
        title: string,
        subtitle: string,
        detail?: string,
        tag?: string,
        duedate?: Date): Observable<BodyNode> {
        let workflowTag: string;
        let workflowDuedate: Date;

        if (tag) workflowTag = tag;
        else workflowTag = "Other";

        if (duedate) workflowDuedate = duedate;
        else workflowDuedate = null;

        let header = new HeaderModel({
            createdBy: userID,
            title: title,
            tag: tag
        });
        return Observable.fromPromise(header.save()).flatMap(header => {
            return this.createBodyNode(Status.NOTE,
                userID,
                userID,
                workflowDuedate,
                subtitle,
                detail,
                header._id,
                [header._id]);
        });
    }

    /**
     * Delete the entrie workflow of the input header node
     * 
     * @static
     * @param {HeaderNode} header header of workflow to be delete
     * @returns {Observable<UpdateResponse[]>} Result of deleted workflow
     * @memberof WorkflowManager
     */
    static delete(header: HeaderNode): Observable<UpdateResponse[]> {
        return Observable.zip(
            Observable.fromPromise(HeaderModel.deleteOne({
                _id: header.getID()
            })),
            Observable.fromPromise(NodeModel.deleteMany({
                ancestors: header.getID()
            }))
        );
    }

    /**
     * Get header node of the input id
     * 
     * @static
     * @param {(mongoose.Types.ObjectId | string)} nodeID header node id
     * @returns {Observable<HeaderNode>} header node object
     * @memberof WorkflowManager
     */
    static getHeaderNode(nodeID: mongoose.Types.ObjectId | string): Observable<HeaderNode> {
        if (typeof nodeID === "string") nodeID = new mongoose.Types.ObjectId(nodeID);
        return Observable.fromPromise(HeaderModel.findById(nodeID)).map(node => new HeaderNode(node));
    }

    /**
     * Get body node of the input id
     * 
     * @static
     * @param {(mongoose.Types.ObjectId | string)} nodeID body node id
     * @returns {Observable<BodyNode>} body node object
     * @memberof WorkflowManager
     */
    static getBodyNode(nodeID: mongoose.Types.ObjectId | string): Observable<BodyNode> {
        if (typeof nodeID === "string") nodeID = new mongoose.Types.ObjectId(nodeID);
        return Observable.fromPromise(NodeModel.findById(nodeID)).map(node => new BodyNode(node));
    }

    /**
     * Create new body node and return that node
     * 
     * @static
     * @param {string} status status of the body node
     * @param {number} owner user id of the owner of the node
     * @param {number} createdBy user id of the one who create this node
     * @param {Date} duedate duedate of the node, undefine if not specify
     * @param {string} subtitle subtitle of the node, undefine if not specify
     * @param {string} detail detail of the node, undefine if not spectfy
     * @param {mongoose.Types.ObjectId} parent object id of the parent node
     * @param {mongoose.Types.ObjectId[]} ancestors array of object id of all parent node
     * @returns {Observable<BodyNode>} 
     * @memberof WorkflowManager
     */
    static createBodyNode(status: string, owner: number, createdBy: number, duedate: Date, subtitle: string, detail: string,
        parent: mongoose.Types.ObjectId, ancestors: mongoose.Types.ObjectId[]): Observable<BodyNode> {
        let node = new NodeModel({
            status: status,
            owner: owner,
            createdBy: createdBy,
            duedate: duedate,
            subtitle: subtitle,
            detail: detail,
            parent: parent,
            ancestors: ancestors
        });
        return Observable.fromPromise(node.save()).map(node => new BodyNode(node));
    }

    /**
     * Clone the node object
     * 
     * @static
     * @param {BodyNode} node original node
     * @returns {Observable<BodyNode>} cloned node
     * @memberof WorkflowManager
     */
    static clone(node: BodyNode): Observable<BodyNode> {
        return this.createBodyNode(node.getStatus(),
            node.getOwner(),
            node.getCreatedBy(),
            node.getDuedate(),
            undefined,
            undefined,
            node.getParentID(),
            node.getAncestors());
    }

    //     /**
    //      * Find workflow node of requested user
    //      * 
    //      * @static
    //      * @param {number} userID User id of user
    //      * @returns {Observable<BodyNode[]>} Observable of event that return array of node
    //      * @memberof WorkflowManager
    //      */
    //     static getUserWorkflow(userID: number): Observable<BodyNode[]> {
    //         return Observable.fromPromise(NodeModel.find({
    //             owner: userID
    //         })).flatMap(nodes => {
    //             let groupNode = _.groupBy(nodes, o => {
    //                 return o.ancestors[0];
    //             });
    //             let userNode: BodyNode[] = [];
    //             for (let key in groupNode) {
    //                 userNode.push(_.last(groupNode[key]));
    //             }
    //             return userNode;
    //         }).flatMap(nodes => {
    //             return this.getTree(nodes._id)
    //         });
    //     }
}