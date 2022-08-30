
## FAQ

Why not use JPA?

> Because JPA does not support reactive frameworks at the moment.  Instead we use Spring Data R2DBC which works like Spring Data JDBC with support for reactive frameworks.

Why not use Redis?

> Complexity of handling data when the Redis installation is a cluster.  In addition there's a chance of data loss that's implied by the clustering of Redis.
>
> Using a database may be slow but at least we have reliability.

Why are there no `@Version` for optimistic locking?

> The data being put in will never be updated, only deleted (via expiration mechanism or explicit revocation) and read
