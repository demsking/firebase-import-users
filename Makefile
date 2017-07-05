GOOGLE_APPLICATION_CREDENTIALS ?= ./credentials.json
CREDENTIALS ?= $(GOOGLE_APPLICATION_CREDENTIALS)
USERS_LIST ?= ./newsletter-list.csv
LOG ?= log
LISTJSON ?= $(USERS_LIST:%.csv=%.json)
BATCH_SIZE ?= 1000

n := $(shell cat $(LISTJSON) | jq '. | length')

batch-iteration := $(shell expr $(n) / $(BATCH_SIZE))
batch-iteration-remainder := $(shell expr $(n) % $(BATCH_SIZE))
batch-date := $(shell date +%Y-%m-%d_%H:%M:%S)

ifneq ($(batch-iteration-remainder),0)
	batch-iteration := $(shell expr $(batch-iteration) + 1)
endif

convert-list:
	./node_modules/.bin/csv2json $(USERS_LIST) $(LISTJSON)

.SILENT: batch retry

batch-import: convert-list
	mkdir -p $(LOG)

	echo "LIST_LENGTH: $(n)"
	echo "BATCH_SIZE: $(BATCH_SIZE)"
	echo "BATCH_ITERATOR: $(batch-iteration)"
	echo ""

	for i in $$(seq 1 $(batch-iteration)); do \
		index=$$(($$i-1)) \
			&& offset=$$(($$index*$(BATCH_SIZE))) \
			&& limit=$$(($$offset+$(BATCH_SIZE))) \
			&& echo "batch $$i/$(batch-iteration) - [$$offset:$$limit]" \
			&& echo "cat $(LISTJSON) | jq '. [$$offset:$$limit]'" \
				| sh -e \
				| GOOGLE_APPLICATION_CREDENTIALS=$(CREDENTIALS) node index.js \
					> $(LOG)/$(batch-date)-batch-$$i-success.log \
					2> $(LOG)/$(batch-date)-batch-$$i-error.log; \
	done

ERROR_FILES ?= $(wildcard $(LOG)/*-error.log)

retry:
	for file in $(ERROR_FILES); do \
		echo $$file; \
		while read line; do \
			echo `jq -Rrn "$$line"` \
				| jq -nc '[inputs]' \
				| GOOGLE_APPLICATION_CREDENTIALS=$(CREDENTIALS) node index.js --retry \
					>> $(LOG)/$(batch-date)-retry-success.log \
					2>> $(LOG)/$(batch-date)-batch-error-retry.log; \
		done < $$file; \
	done

SUCCESS_FILES ?= $(wildcard $(LOG)/*success.log)

update-profile:
	for file in $(SUCCESS_FILES); do \
		echo $$file; \
		while read line; do \
			echo `jq -Rrn "$$line"` \
				| jq -nc '[inputs]' \
				| GOOGLE_APPLICATION_CREDENTIALS=$(CREDENTIALS) node index.js --update-profile \
					>> $(LOG)/$(batch-date)-update-profile-success.log \
					2>> $(LOG)/$(batch-date)-update-profile-error.log; \
		done < $$file; \
	done
