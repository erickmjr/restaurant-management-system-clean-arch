interface IRestaurant {
    id: string;
    name: string;
    ownerId: string;
    photo: string | null;
    updatedAt: Date;
    createdAt: Date;
    deletedAt: Date | null;
}

export class Restaurant {
    get id() {
        return this.props.id;
    }

    get name() {
        return this.props.name;
    }

    get ownerId() {
        return this.props.ownerId;
    }

    get photo() {
        return this.props.photo;
    }

    get updatedAt() {
        return this.props.updatedAt;
    }

    get createdAt() {
        return this.props.createdAt;
    }

    get deletedAt() {
        return this.props.deletedAt;
    }

    protected props: IRestaurant;

    constructor(
        props: {
            createdAt: string;
            updatedAt: string;
            deletedAt?: string;
            id: string;
            ownerId: string;
            photo?: string;
            name: string;
        }
    ) {
        this.props = {
            ...props,
            createdAt: props.createdAt ? new Date(props.createdAt) : new Date(),
            updatedAt: props.updatedAt ? new Date(props.updatedAt) : new Date(),
            deletedAt: props.deletedAt ? new Date(props.deletedAt) : null,
            id: props.id,
            ownerId: props.ownerId,
            photo: props.photo ?? null
        }
    };

    delete(): boolean {
        if (this.props.deletedAt) 
            return false;

        this.props.deletedAt = new Date();

        return true;
    }

    restore(): boolean {
        if (!this.props.deletedAt)
            return false;

        this.props.deletedAt = null;
        this.props.updatedAt = new Date();

        return true;
    }

}