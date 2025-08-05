CREATE TABLE "user_groups" (
	"userId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	CONSTRAINT "user_groups_userId_groupId_pk" PRIMARY KEY("userId","groupId")
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_groupId_group_id_fk";
--> statement-breakpoint
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_groupId_group_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "groupId";